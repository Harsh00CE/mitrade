import { app } from "./app.js";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { calculateAvailableBalance } from "./utils/utilityFunctions.js";
import mongoose from "mongoose";
dotenv.config({ path: ".env" });

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

console.log("WebSocket server running on ws://localhost:8080");

const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

binanceWs.on("message", (data) => {
    const tickers = JSON.parse(data);


    const usdPairs = tickers.filter(ticker =>
        ticker.s.endsWith('USDT') || ticker.s.endsWith('BUSD') || ticker.s.endsWith('USDC')
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

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

const main = async () => {
    const DB_CONNECTION_URL = process.env.DB_CONNECTION_URL;
    if(DB_CONNECTION_URL){
        await mongoose.connect(DB_CONNECTION_URL);
        console.log("DB connection established");
    }else{
        console.error("Unable to set database connection");
    }
    app.listen(3000);
    console.log("Server started successfully.");
}

main();