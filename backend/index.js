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
        console.log("Received message:", data);
        
        if (data.type === "subscribeFavorites") {
            const { userId } = data;
            console.log("User ID:", userId);

            if (!userId) return;

            const user = await UserModel.findById(userId);
            if (!user) {
                console.log(`User ${userId} not found`);
                return;
            }

            const favoriteTokens = Array.isArray(user.favoriteTokens) ? user.favoriteTokens : [];
            if (favoriteTokens.length === 0) {
                console.log(`User ${userId} has no favorite tokens.`);
            } else {
                console.log(`User ${userId} subscribed to favorite tokens:`, favoriteTokens);
            }

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
        type: "crypto"
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

// OANDA WebSocket for Forex Data
const OANDA_API_KEY = process.env.OANDA_API_KEY;
const OANDA_ACCOUNT_ID = process.env.OANDA_ACCOUNT_ID;
const OANDA_INSTRUMENTS = "EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD"; 

const OANDA_WS_URL = `wss://stream-fxpractice.oanda.com/v3/accounts/${OANDA_ACCOUNT_ID}/pricing/stream?instruments=${OANDA_INSTRUMENTS}`;

if (OANDA_API_KEY) {
    const oandaWs = new WebSocket(OANDA_WS_URL, {
        headers: {
            "Authorization": `Bearer ${OANDA_API_KEY}`,
        }
    });

    oandaWs.on("open", () => {
        console.log("Connected to OANDA Forex WebSocket");
    });

    oandaWs.on("message", async (data) => {
        try {
            const message = JSON.parse(data);

            if (message.prices) {
                const formattedForexData = message.prices.map(price => ({
                    symbol: price.instrument,
                    price: parseFloat(price.bids[0].price).toFixed(4),
                    type: "forex"
                }));

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "forexData", data: formattedForexData }));
                    }
                });

                for (const forex of formattedForexData) {
                    await checkAndSendAlerts(forex.symbol, forex.price);
                }
            }
        } catch (error) {
            console.error("Error processing OANDA data:", error);
        }
    });

    oandaWs.on("close", () => {
        console.log("Disconnected from OANDA Forex WebSocket");
    });

    oandaWs.on("error", (error) => {
        console.error("OANDA WebSocket error:", error);
    });
} else {
    console.warn("OANDA_API_KEY not set - Forex data will not be available");
}

// Check alerts every 60 seconds
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
