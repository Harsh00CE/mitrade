import { app } from "./app.js";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import connectDB from "./ConnectDB/ConnectionDB.js";
import UserModel from "./schemas/userSchema.js";
import PairInfoModel from "./schemas/pairInfo.js";
import AlertModel from "./schemas/alertSchema.js";
import { sendVerificationEmail } from "./helpers/sendAlertEmail.js";

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
            console.log("User ID:", userId);

            if (!userId) return;

            const user = await UserModel.findById(userId);
            if (!user) {
                console.log(`User ${userId} not found`);
                return;
            }

            // Make sure that the user's favorite tokens are valid
            const favoriteTokens = Array.isArray(user.favoriteTokens) ? user.favoriteTokens : [];
            if (favoriteTokens.length === 0) {
                console.log(`User ${userId} has no favorite tokens.`);
            } else {
                console.log(`User ${userId} subscribed to favorite tokens:`, favoriteTokens);
            }

            // Store the tokens in the map
            favoriteSubscriptions.set(userId, new Set(favoriteTokens));
            ws.userId = userId;
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
            console.log("User ID ==> :", userId);

            if (userId && favoriteSubscriptions.has(userId)) {
                const favoriteTokens = favoriteSubscriptions.get(userId);
                const filteredData = formattedTickers.filter(t => favoriteTokens.has(t.symbol));
                if (filteredData.length > 0) {
                    console.log(`Sending favorite tokens to ${userId}:`, filteredData);
                    client.send(JSON.stringify({ type: "favoriteTokens", data: filteredData }));
                } else {
                    console.log(`No favorite tokens found for ${userId}`);
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


// const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
// const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY'];

// const forexPriceCache = new Map();

// async function getForexPrices() {
//     const prices = {};
//     const requests = SYMBOLS.map(async (symbol) => {
//         try {
//             const [from_currency, to_currency] = symbol.split('/');
//             const response = await axios.get(
//                 `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from_currency}&to_currency=${to_currency}&apikey=${API_KEY}`
//             );

//             // Check if the response contains the expected data
//             if (!response.data || !response.data['Realtime Currency Exchange Rate']) {
//                 console.error(`Invalid API response for ${symbol}:`, response.data);

//                 // Return cached value if available
//                 if (forexPriceCache.has(symbol)) {
//                     prices[symbol] = forexPriceCache.get(symbol);
//                     return;
//                 }

//                 throw new Error('Invalid API response structure');
//             }

//             const exchangeData = response.data['Realtime Currency Exchange Rate'];
//             const priceData = {
//                 symbol,
//                 price: parseFloat(exchangeData['5. Exchange Rate']).toFixed(4),
//                 bid: parseFloat(exchangeData['8. Bid Price']).toFixed(4),
//                 ask: parseFloat(exchangeData['9. Ask Price']).toFixed(4),
//                 lastRefreshed: exchangeData['6. Last Refreshed'],
//                 timezone: exchangeData['7. Time Zone']
//             };

//             prices[symbol] = priceData;
//             forexPriceCache.set(symbol, priceData);
//         } catch (error) {
//             console.error(`Error fetching forex price for ${symbol}:`, error.message);

//             // Fallback to cached value if available
//             if (forexPriceCache.has(symbol)) {
//                 prices[symbol] = forexPriceCache.get(symbol);
//             } else {
//                 prices[symbol] = {
//                     symbol,
//                     price: 'N/A',
//                     bid: 'N/A',
//                     ask: 'N/A',
//                     lastRefreshed: new Date().toISOString(),
//                     timezone: 'UTC'
//                 };
//             }
//         }
//     });

//     await Promise.all(requests);
//     return prices;
// }

// wss.on('connection', ws => {
//     console.log('Client connected');

//     // Send initial prices immediately
//     getForexPrices().then(prices => {
//         ws.send(JSON.stringify({
//             type: 'forexData',
//             data: prices
//         }));
//     });

//     // Set up periodic updates (every 60 seconds to avoid rate limiting)
//     const interval = setInterval(async () => {
//         const prices = await getForexPrices();
//         ws.send(JSON.stringify({
//             type: 'forexData',
//             data: prices
//         }));
//     }, 2000); // 60 seconds

//     ws.on('close', () => {
//         console.log('Client disconnected');
//         clearInterval(interval);
//     });
// });


const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
const forexSymbols = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD"];
const forexDataStore = {};

if (TWELVEDATA_API_KEY) {
    const TWELVEDATA_WS_URL = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVEDATA_API_KEY}`;
    const twelveDataWs = new WebSocket(TWELVEDATA_WS_URL);

    twelveDataWs.on("open", () => {
        console.log("Connected to TwelveData Forex WebSocket");
        twelveDataWs.send(JSON.stringify({
            action: "subscribe",
            params: { symbols: forexSymbols.join(",") }
        }));
    });

    twelveDataWs.on("message", async (data) => {
        try {
            const message = JSON.parse(data);

            if (message.event === "price") {
                const { symbol, price } = message;

                // Update stored forex prices
                forexDataStore[symbol] = {
                    symbol: symbol,
                    price: parseFloat(price).toFixed(4),
                    volume: "N/A",
                    change: "N/A",
                    type: "forex"
                };

                // Broadcast all forex data at once
                const allForexData = Object.values(forexDataStore);

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "forexData",
                            data: allForexData
                        }));
                    }
                });

                await checkAndSendAlerts(symbol, parseFloat(price));
            }
        } catch (error) {
            console.error("Error processing forex data:", error);
        }
    });

    twelveDataWs.on("close", () => {
        console.log("Disconnected from TwelveData Forex WebSocket");
        // Implement reconnection logic here
    });

    twelveDataWs.on("error", (error) => {
        console.error("Forex WebSocket error:", error);
    });
} else {
    console.warn("TWELVEDATA_API_KEY not set - Forex data will not be available");
}












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