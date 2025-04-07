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
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

const TOP_100_FOREX_PAIRS = [
    'XAU_USD', 'XAG_USD', 'XPT_USD', 'XPD_USD'
];

const TOP_100_CRYPTO_PAIRS = [
    'BTC_USD', 'ETH_USD' , 'BCH_USD' , 'LTC_USD', 'SOL_USD', 'DOGE_USD',
];

const server = createServer();
const wss = new WebSocketServer({ server });

const PORT = 3001;

const OANDA_ACCOUNT_ID = '101-001-31219533-001';
const OANDA_API_KEY = '5feac4ec1ff4d5d5fa28bd53f31a2fd7-d3da8ffeb17a5a449d6f46f583f9bc4a';
const OANDA_URL = `https://stream-fxpractice.oanda.com/v3/accounts/${OANDA_ACCOUNT_ID}/pricing/stream`;

const PRICE_UPDATE_INTERVAL = 1000;
const currentPrices = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.send(JSON.stringify({
        type: 'pairList',
        forexPairs: TOP_100_FOREX_PAIRS,
        cryptoPairs: TOP_100_CRYPTO_PAIRS
    }));

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

let oandaStreamController = null;

function subscribeToPairs(pairs) {
    if (oandaStreamController) {
        oandaStreamController.destroy();
        oandaStreamController = null;
    }

    const instruments = Array.from(new Set([...pairs])).join(',');
    const url = `${OANDA_URL}?instruments=${instruments}`;

    axios({
        method: 'get',
        url: url,
        headers: {
            "Authorization": `Bearer ${OANDA_API_KEY}`
        },
        responseType: 'stream'
    })
        .then(response => {
            console.log(`Subscribed to ${pairs.length} pairs`);

            const stream = response.data;
            oandaStreamController = stream;

            let buffer = ''; // Buffer to accumulate incomplete JSON

            stream.on('data', chunk => {
                buffer += chunk.toString(); // Append new chunk to buffer
                const lines = buffer.split('\n');

                // Process all complete lines except the last one (might be incomplete)
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'PRICE') {
                            const pairType = TOP_100_FOREX_PAIRS.includes(data.instrument) ? 'forex' : 'crypto';
                            const priceData = {
                                instrument: data.instrument,
                                time: data.time,
                                bid: data.bids[0].price,
                                ask: data.asks[0].price,
                                spread: (data.asks[0].price - data.bids[0].price).toFixed(5),
                                type: pairType
                            };

                            currentPrices.set(data.instrument, priceData);
                            broadcastToAllClients(priceData);
                            checkAndSendAlerts(data.instrument, parseFloat(priceData.bid));
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e.message, 'Line:', line);
                    }
                }

                // Keep the last (potentially incomplete) line in the buffer
                buffer = lines[lines.length - 1];
            });

            stream.on('error', err => {
                console.error('Stream error:', err);
                restartStream();
            });

            stream.on('end', () => {
                console.log('Stream ended');
                restartStream();
            });
        })
        .catch(err => {
            console.error('Connection error:', err.message);
            restartStream();
        });
}

function sendAllPrices() {
    if (currentPrices.size > 0) {
        const allPrices = Array.from(currentPrices.values());
        const forexPrices = allPrices.filter(price => price.type === 'forex');
        const cryptoPrices = allPrices.filter(price => price.type === 'crypto');

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if (forexPrices.length > 0) {
                    client.send(JSON.stringify({
                        type: 'allForexPrice',
                        data: forexPrices,
                        timestamp: new Date().toISOString()
                    }));
                }

                if (cryptoPrices.length > 0) {
                    client.send(JSON.stringify({
                        type: 'allCryptoPrice',
                        data: cryptoPrices,
                        timestamp: new Date().toISOString()
                    }));
                }
            }
        });
    }
}

function broadcastToAllClients(priceData) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'priceUpdate',
                data: priceData
            }));
        }
    });
}

function restartStream() {
    console.log('Reconnecting in 5 seconds...');
    setTimeout(() => {
        subscribeToPairs([...TOP_100_FOREX_PAIRS, ...TOP_100_CRYPTO_PAIRS]);
    }, 5000);
}

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    subscribeToPairs([...TOP_100_FOREX_PAIRS, ...TOP_100_CRYPTO_PAIRS]);
    setInterval(sendAllPrices, PRICE_UPDATE_INTERVAL);
});

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