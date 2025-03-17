import { app } from "./app.js";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import connectDB from "./ConnectDB/ConnectionDB.js";
import { calculateAvailableBalance } from "./utils/utilityFunctions.js";
import AlertModel from "./schemas/alertSchema.js";
import { sendVerificationEmail } from "./helpers/sendAlertEmail.js";
import checkAlerts from "./checkAlerts.js";
dotenv.config({ path: ".env" });


await connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});


const wss = new WebSocketServer({ port: 8080 });

const broadcastAvailableBalance = (userId, availableBalance) => {
    console.log("broadcastAvailableBalance => ", userId, availableBalance);

    wss.clients.forEach((client) => {
        if (client.userId === userId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "availableBalance", data: availableBalance }));
        }
    });
};
wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "subscribe") {
            ws.userId = data.userId;
            console.log(`Client subscribed to user ${data.userId}`);
        }
        const { symbol, price } = data;
        if (!symbol || !price) {
            console.log("sumbol or price is not defined");
        }

        checkAlerts(symbol, price);
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});
export const updateAvailableBalance = async (userId) => {
    try {
        const availableBalance = await calculateAvailableBalance(userId);
        broadcastAvailableBalance(userId, availableBalance);
    } catch (error) {
        console.error("Error updating available balance:", error);
    }
};

console.log("WebSocket server running on ws://192.168.0.103:8080");

const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
const TWELVEDATA_WS_URL = "wss://ws.twelvedata.com/v1/quotes/price";

const connectToTwelvedata = (ws, symbols) => {
    const twelvedataWs = new WebSocket(TWELVEDATA_WS_URL);

    twelvedataWs.on("open", () => {
        console.log("Connected to Twelvedata WebSocket");

        // Subscribe to commodity symbols
        twelvedataWs.send(
            JSON.stringify({
                action: "subscribe",
                params: {
                    symbols: symbols.join(","), // e.g., "GOLD/USD,SILVER/USD"
                    apikey: process.env.TWELVEDATA_API_KEY,
                },
            })
        );
    });

    twelvedataWs.on("message", (data) => {
        const message = JSON.parse(data);

        // Forward the real-time data to the client
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });

    twelvedataWs.on("close", () => {
        console.log("Disconnected from Twelvedata WebSocket");
    });

    twelvedataWs.on("error", (error) => {
        console.error("Twelvedata WebSocket error:", error);
    });

    return twelvedataWs;
};



binanceWs.on("message", (data) => {
    const tickers = JSON.parse(data);


    const usdPairs = tickers.filter(ticker =>
        ticker.s.endsWith('USDT')
    );
    const formattedTickers = usdPairs.map((ticker) => ({
        symbol: ticker.s,
        price: parseFloat(ticker.c).toFixed(4),
        volume: parseFloat(ticker.v).toFixed(2),
        change: parseFloat(ticker.P).toFixed(2),
    }));

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(formattedTickers));
        }
    });
});

binanceWs.on("message", async (data) => {
    const tickers = JSON.parse(data);
    const alerts = await AlertModel.find({ isActive: true }).populate("67ced33ed132690a73244906");

    for (let alert of alerts) {
        const ticker = tickers.find(t => t.s === alert.symbol);
        if (!ticker) continue;

        const currentPrice = parseFloat(ticker.c);
        const now = new Date();
        let shouldNotify = false;

        if ((alert.type === "buy" && currentPrice <= alert.price) ||
            (alert.type === "sell" && currentPrice >= alert.price)) {

            if (alert.alertOption === "onlyOnce") {
                shouldNotify = true;
                alert.isActive = false;
            } else if (alert.alertOption === "onceADay") {
                const lastTriggeredDate = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
                if (!lastTriggeredDate || lastTriggeredDate.toDateString() !== now.toDateString()) {
                    shouldNotify = true;
                    alert.lastTriggered = now;
                }
            }

            if (shouldNotify) {
                const emailText = `Price Alert: ${alert.symbol} has reached ${alert.price}.`;
                sendVerificationEmail(alert.userId.email, `Crypto Alert for ${alert.symbol}`, emailText);
                await alert.save();
            }
        }
    }
});


wss.on("connection", (ws) => {
    console.log("New client connected");
    let twelvedataWs;

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.action === "subscribe" && data.symbols) {
            twelvedataWs = connectToTwelvedata(ws, data.symbols);
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");

        if (twelvedataWs) {
            twelvedataWs.close();
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

