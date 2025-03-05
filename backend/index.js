import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./dbConnector/connection.js";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import axios from "axios";
dotenv.config({ path: ".env" });

await connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});


const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server running on ws://localhost:8080");

const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

binanceWs.on("message", (data) => {
    const tickers = JSON.parse(data);

    const formattedTickers = tickers.map((ticker) => ({
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




































// const server = app.listen(process.env.PORT || 5000, () => {
//     console.log(`Server running on port ${process.env.PORT || 5000}`);
//   });

// const wss = new WebSocketServer({ server });

// const fetchAndBroadcastCryptoData = async () => {
//     try {
//         const response = await axios.get(
//             "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
//         );
//         const cryptoData = response.data;

//         // Broadcast data to all connected clients
//         wss.clients.forEach((client) => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(JSON.stringify(cryptoData));
//             }
//         });
//     } catch (err) {
//         console.error("Error fetching crypto data:", err);
//     }
// };

// setInterval(fetchAndBroadcastCryptoData, 6000);

// wss.on("connection", (ws) => {
//     console.log("New client connected");

//     ws.on("close", () => {
//         console.log("Client disconnected");
//     });
// });
