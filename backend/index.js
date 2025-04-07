import { app } from "./app.js";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import connectDB from "./ConnectDB/ConnectionDB.js";
import UserModel from "./schemas/userSchema.js";
import PairInfoModel from "./schemas/pairInfo.js";
import AlertModel from "./schemas/alertSchema.js";
import { sendVerificationEmail } from "./helpers/sendAlertEmail.js";
import { createServer } from 'http';
import axios from 'axios';


dotenv.config({ path: ".env" });

await connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}
    `);
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




// const TOP_100_FOREX_PAIRS = [
//     'XAU_USD', 'XAG_USD', 'XPT_USD', 'XPD_USD'];

// const server = createServer();
// const forexWss = new WebSocketServer({ server });

// const PORT = 3001;

// const OANDA_ACCOUNT_ID = '101-001-31219533-001';
// const OANDA_API_KEY = '5feac4ec1ff4d5d5fa28bd53f31a2fd7-d3da8ffeb17a5a449d6f46f583f9bc4a';
// const OANDA_URL = `https://stream-fxpractice.oanda.com/v3/accounts/${OANDA_ACCOUNT_ID}/pricing/stream`;

// // Add this near the top with other constants
// const PRICE_UPDATE_INTERVAL = 1000; // 1 second

// // Add this with other variable declarations
// const currentPrices = new Map();

// forexWss.on('connection', (ws) => {
//     console.log('New client connected');

//     // Send initial list of available pairs
//     ws.send(JSON.stringify({
//         type: 'pairList',
//         pairs: TOP_100_FOREX_PAIRS
//     }));

//     ws.on('close', () => {
//         console.log('Client disconnected');
//     });
// });

// // Connect to OANDA stream
// let oandaStreamController = null;

// function subscribeToPairs(pairs) {
//     // Safely close the previous stream if exists
//     if (oandaStreamController) {
//         oandaStreamController.destroy();
//         oandaStreamController = null;
//     }

//     const instruments = Array.from(new Set([...pairs])).join(',');
//     const url = `${OANDA_URL}?instruments=${instruments}`;

//     axios({
//         method: 'get',
//         url: url,
//         headers: {
//             "Authorization": `Bearer ${OANDA_API_KEY}`
//         },
//         responseType: 'stream'
//     })
//         .then(response => {
//             console.log(`Subscribed to ${pairs.length} forex pairs`);

//             const stream = response.data;
//             oandaStreamController = stream; // Save reference for cleanup

//             stream.on('data', chunk => {
//                 const lines = chunk.toString().split('\n');

//                 for (const line of lines) {
//                     if (!line.trim()) continue;
//                     if (!line.startsWith('{') || !line.endsWith('}')) {
//                         console.log('Skipping malformed line:', line);
//                         continue;
//                     }

//                     try {
//                         const data = JSON.parse(line);
//                         if (data.type === 'PRICE') {
//                             const priceData = {
//                                 instrument: data.instrument,
//                                 time: data.time,
//                                 bid: data.bids[0].price,
//                                 ask: data.asks[0].price,
//                                 spread: (data.asks[0].price - data.bids[0].price).toFixed(5),
//                                 type: "forex"
//                             };

//                             currentPrices.set(data.instrument, priceData);
//                             broadcastToAllClients(priceData);
//                         }
//                     } catch (e) {
//                         console.error('Error parsing data:', e.message, 'Line:', line);
//                     }
//                 }
//             });

//             stream.on('error', err => {
//                 console.error('Stream error:', err);
//                 restartStream();
//             });

//             stream.on('end', () => {
//                 console.log('Stream ended');
//                 restartStream();
//             });
//         })
//         .catch(err => {
//             console.error('Connection error:', err.message);
//             restartStream();
//         });
// }


// function sendAllPrices() {
//     if (currentPrices.size > 0) {
//         const allPrices = Array.from(currentPrices.values());
//         forexWss.clients.forEach(client => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(JSON.stringify({
//                     type: 'allPrices',
//                     data: allPrices,
//                     timestamp: new Date().toISOString()
//                 }));
//             }
//         });
//     }
// }

// function broadcastToAllClients(priceData) {
//     // Broadcast to forex clients
//     forexWss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify({
//                 type: 'priceUpdate',
//                 data: priceData
//             }));
//         }
//     });

//     // Broadcast to main WebSocket clients if needed
//     wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify({
//                 type: 'allTokens',
//                 data: [priceData]
//             }));
//         }
//     });
// }



// function restartStream() {
//     console.log('Reconnecting in 5 seconds...');
//     setTimeout(() => {
//         subscribeToPairs(TOP_100_FOREX_PAIRS);
//     }, 5000);
// }



// server.listen(PORT, () => {
//     console.log(`WebSocket server running on port ${PORT}`);
//     subscribeToPairs(TOP_100_FOREX_PAIRS);
//     setInterval(sendAllPrices, PRICE_UPDATE_INTERVAL);
// });




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