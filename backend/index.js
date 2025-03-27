import { app } from "./app.js";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import connectDB from "./ConnectDB/ConnectionDB.js";
import UserModel from "./schemas/userSchema.js";
import PairInfoModel from "./schemas/pairInfo.js";
import AlertModel from "./schemas/alertSchema.js";
import { sendVerificationEmail } from "./helpers/sendAlertEmail.js";
import axios from "axios";

dotenv.config({ path: ".env" });

await connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

const wss = new WebSocketServer({ port: 8080 });
console.log(`WebSocket server running on ws://${process.env.SERVER_URL}:8080`);

const favoriteSubscriptions = new Map();
const adminTokens = new Set();

const loadAdminTokens = async () => {
    try {
        const pairs = await PairInfoModel.find({}, "symbol");
        adminTokens.clear();
        pairs.forEach((pair) => adminTokens.add(pair.symbol));
    } catch (error) {
        console.error("Error loading admin tokens:", error);
    }
};

await loadAdminTokens();

wss.on("connection", async (ws) => {
    console.log("New client connected");

    ws.on("message", async (message) => {
        const data = JSON.parse(message);

        if (data.type == "subscribeFavorites") {
            const { userId } = data;

            if (!userId) return;

            const user = await UserModel.findById(userId);
            if (!user) {
                console.log(`User ${userId} not found`);
                return;
            }

            const favoriteTokens = user.favoriteTokens || [];
            favoriteSubscriptions.set(userId, new Set(favoriteTokens));
            ws.userId = userId;

            console.log(`User ${userId} subscribed to favorite tokens:`, favoriteTokens);
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

// Binance WebSocket for crypto data
const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

binanceWs.on("message", async (data) => {
    const tickers = JSON.parse(data);

    const usdPairs = tickers.filter(ticker => ticker.s.endsWith('USDT'));

    const formattedTickers = usdPairs.map((ticker) => ({
        symbol: ticker.s,
        price: parseFloat(ticker.c).toFixed(4),
        volume: parseFloat(ticker.v).toFixed(2),
        change: parseFloat(ticker.P).toFixed(2),
        type: "crypto" // Add type identifier
    }));

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "allTokens", data: formattedTickers }));

            const userId = client.userId;
            if (userId && favoriteSubscriptions.has(userId)) {
                const favoriteTokens = favoriteSubscriptions.get(userId);
                const filteredData = formattedTickers.filter(t => favoriteTokens.has(t.symbol));
                if (filteredData.length > 0) {
                    client.send(JSON.stringify({ type: "favoriteTokens", data: filteredData }));
                }
            }

            const adminFilteredData = formattedTickers.filter(t => adminTokens.has(t.symbol));
            if (adminFilteredData.length > 0) {
                client.send(JSON.stringify({ type: "adminTokens", data: adminFilteredData }));
            }
        }
    });

    for (const ticker of formattedTickers) {
        const { symbol, price } = ticker;
        await checkAndSendAlerts(symbol, price);
    }
});




const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY'];

// Cache to store the last successful prices
const forexPriceCache = new Map();

async function getForexPrices() {
    const prices = {};
    const requests = SYMBOLS.map(async (symbol) => {
        try {
            const [from_currency, to_currency] = symbol.split('/');
            const response = await axios.get(
                `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from_currency}&to_currency=${to_currency}&apikey=${API_KEY}`
            );

            // Check if the response contains the expected data
            if (!response.data || !response.data['Realtime Currency Exchange Rate']) {
                console.error(`Invalid API response for ${symbol}:`, response.data);

                // Return cached value if available
                if (forexPriceCache.has(symbol)) {
                    prices[symbol] = forexPriceCache.get(symbol);
                    return;
                }

                throw new Error('Invalid API response structure');
            }

            const exchangeData = response.data['Realtime Currency Exchange Rate'];
            const priceData = {
                symbol,
                price: parseFloat(exchangeData['5. Exchange Rate']).toFixed(4),
                bid: parseFloat(exchangeData['8. Bid Price']).toFixed(4),
                ask: parseFloat(exchangeData['9. Ask Price']).toFixed(4),
                lastRefreshed: exchangeData['6. Last Refreshed'],
                timezone: exchangeData['7. Time Zone']
            };

            prices[symbol] = priceData;
            forexPriceCache.set(symbol, priceData);
        } catch (error) {
            console.error(`Error fetching forex price for ${symbol}:`, error.message);

            // Fallback to cached value if available
            if (forexPriceCache.has(symbol)) {
                prices[symbol] = forexPriceCache.get(symbol);
            } else {
                prices[symbol] = {
                    symbol,
                    price: 'N/A',
                    bid: 'N/A',
                    ask: 'N/A',
                    lastRefreshed: new Date().toISOString(),
                    timezone: 'UTC'
                };
            }
        }
    });

    await Promise.all(requests);
    return prices;
}

// Update the WebSocket connection handler
wss.on('connection', ws => {
    console.log('Client connected');

    // Send initial prices immediately
    getForexPrices().then(prices => {
        ws.send(JSON.stringify({
            type: 'forexData',
            data: prices
        }));
    });

    // Set up periodic updates (every 60 seconds to avoid rate limiting)
    const interval = setInterval(async () => {
        const prices = await getForexPrices();
        ws.send(JSON.stringify({
            type: 'forexData',
            data: prices
        }));
    }, 2000); // 60 seconds

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});



setInterval(loadAdminTokens, 60000);

const checkAndSendAlerts = async (symbol, price) => {
    const alerts = await AlertModel.find({ symbol, triggered: false });

    for (const alert of alerts) {
        const { userId, alertPrice, alertType, frequency, lastTriggered } = alert;

        if (
            (alertType === "sell" && price >= alertPrice) ||
            (alertType === "buy" && price <= alertPrice)
        ) {
            const now = new Date();
            let shouldSendEmail = false;

            if (frequency === "onlyOnce") {
                shouldSendEmail = true;
                alert.triggered = true;
            } else if (frequency === "onceADay") {
                const lastTriggeredDate = lastTriggered ? new Date(lastTriggered) : null;
                if (!lastTriggeredDate || lastTriggeredDate.toDateString() !== now.toDateString()) {
                    shouldSendEmail = true;
                    alert.lastTriggered = now;
                }
            }

            if (shouldSendEmail) {
                const user = await UserModel.findById(userId);
                if (user && user.email) {
                    console.log("Sending email alert for:", symbol, "at price:", alertPrice);
                    await sendVerificationEmail(user.email, symbol, alertPrice, alertType);
                }
            }

            await alert.save();
        }
    }
};