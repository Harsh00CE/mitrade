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
console.log("WebSocket server running on ws://192.168.0.103:8080");

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

const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

binanceWs.on("message", async (data) => {
    const tickers = JSON.parse(data);

    const usdPairs = tickers.filter(ticker => ticker.s.endsWith('USDT'));

    const formattedTickers = usdPairs.map((ticker) => ({
        symbol: ticker.s,
        price: parseFloat(ticker.c).toFixed(4),
        volume: parseFloat(ticker.v).toFixed(2),
        change: parseFloat(ticker.P).toFixed(2),
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

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
const TWELVEDATA_WS_URL = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVEDATA_API_KEY}`;

const forexSymbols = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"]; 

const twelveDataWs = new WebSocket(TWELVEDATA_WS_URL);

twelveDataWs.on("open", () => {
    console.log("Connected to TwelveData WebSocket");

    twelveDataWs.send(
        JSON.stringify({
            action: "subscribe",
            params: {
                symbols: forexSymbols.join(","),
            },
        })
    );
});

twelveDataWs.on("message", async (data) => {
    const message = JSON.parse(data);
    
    if (message.event === "price") {
        const { symbol, price } = message;

        const formattedTicker = {
            symbol: symbol,
            price: parseFloat(price).toFixed(4),
            volume: "N/A", 
            change: "N/A", 
        };

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "forexTokens", data: [formattedTicker] }));
            }
        });

        await checkAndSendAlerts(symbol, parseFloat(price));
    } else if (message.event === "heartbeat") {
        console.log("TwelveData heartbeat received");
    } else if (message.event === "error") {
        console.error("TwelveData error:", message.message);
    }
});

twelveDataWs.on("close", () => {
    console.log("Disconnected from TwelveData WebSocket");
});

twelveDataWs.on("error", (error) => {
    console.error("TwelveData WebSocket error:", error);
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
                    console.log("Sending email alert price: ", alertPrice);
                    await sendVerificationEmail(user.email, symbol, alertPrice, alertType);
                }
            }

            await alert.save(); 
        }
    }
};