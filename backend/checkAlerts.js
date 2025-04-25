// import { sendVerificationEmail } from "./helpers/sendAlertEmail.js";
// import AlertModel from "./schemas/alertSchema.js";
// import UserModel from "./schemas/userSchema.js";


// const checkAlerts = async (symbol, price) => {
//     const alerts = await AlertModel.find({ symbol, isTriggered: false });

//     for (const alert of alerts) {
//         const shouldTrigger =
//             (alert.alertType === "buy" && price <= alert.alertPrice) ||
//             (alert.alertType === "sell" && price >= alert.alertPrice);

//         if (shouldTrigger) {
//             // Fetch the user to get their email
//             const user = await UserModel.findById(alert.userId);
//             if (!user) {
//                 console.error("User not found for alert:", alert._id);
//                 continue;
//             }

//             // Send an email to the user
//             const emailSubject = `Alert Triggered: ${symbol} ${alert.alertType} at ${price}`;
//             const emailText = `Your ${alert.alertType} alert for ${symbol} at ${alert.alertPrice} has been triggered. Current price: ${price}.`;

//             const emailSent = await sendVerificationEmail(user.email, emailSubject, emailText);

//             if (emailSent) {
//                 console.log(`Email sent to ${user.email} for alert ${alert._id}`);
//             } else {
//                 console.error(`Failed to send email for alert ${alert._id}`);
//             }

//             if (alert.frequency === "onlyOnce") {
//                 alert.isTriggered = true;
//             } else if (alert.frequency === "onceADay") {
//                 const today = new Date();
//                 if (!alert.lastTriggeredDate || alert.lastTriggeredDate.toDateString() !== today.toDateString()) {
//                     alert.lastTriggeredDate = today;
//                 } else {
//                     continue; 
//                 }
//             }

//             await alert.save();
//         }
//     }
// };

// export default checkAlerts;





// import axios from 'axios';


// const url = "https://stream-fxpractice.oanda.com/v3/accounts/101-001-31219533-001/pricing/stream?instruments=EUR_USD";
// const headers = {
//     "Authorization": "Bearer 5feac4ec1ff4d5d5fa28bd53f31a2fd7-d3da8ffeb17a5a449d6f46f583f9bc4a"
// };

// async function streamOandaData() {
//     try {
//         const response = await axios({
//             method: 'get',
//             url: url,
//             headers: headers,
//             responseType: 'stream'
//         });

//         response.data.on('data', chunk => {
//             const lines = chunk.toString().split('\n');
//             lines.forEach(line => {
//                 if (line.trim() !== '') {
//                     try {
//                         const data = JSON.parse(line);
//                         console.log(data);
//                         // Process the data here
//                     } catch (e) {
//                         console.error('Error parsing JSON:', e);
//                     }
//                 }
//             });
//         });

//         response.data.on('error', err => {
//             console.error('Stream error:', err);
//             // Reconnect logic could go here
//         });

//         response.data.on('end', () => {
//             console.log('Stream ended, reconnecting...');
//             setTimeout(streamOandaData, 5000); // Reconnect after 5 seconds
//         });

//     } catch (error) {
//         console.error('Request failed:', error.message);
//         setTimeout(streamOandaData, 5000); // Retry after 5 seconds
//     }
// }

// streamOandaData();






import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import axios from 'axios';

// Top 100 Forex pairs (major, minor, and exotic)
const TOP_100_FOREX_PAIRS = [
    'EUR_USD', 'USD_JPY', 'GBP_USD', 'AUD_USD', 'USD_CAD'];

const server = createServer();
const forexWss = new WebSocketServer({ server });

const OANDA_ACCOUNT_ID = '101-001-31219533-001';
const OANDA_API_KEY = '5feac4ec1ff4d5d5fa28bd53f31a2fd7-d3da8ffeb17a5a449d6f46f583f9bc4a';
const OANDA_URL = `https://stream-fxpractice.oanda.com/v3/accounts/${OANDA_ACCOUNT_ID}/pricing/stream`;

// Add this near the top with other constants
const PRICE_UPDATE_INTERVAL = 1000; // 1 second

// Add this with other variable declarations
const currentPrices = new Map();

// Track active subscriptions
let activeSubscriptions = new Set();

// Start server
const PORT = process.env.SOCKET_PORT||3001;

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    subscribeToPairs(TOP_100_FOREX_PAIRS);
    setInterval(sendAllPrices, PRICE_UPDATE_INTERVAL);
});

// WebSocket connection handler
forexWss.on('connection', (ws) => {
    console.log('New client connected');

    // Send initial list of available pairs
    ws.send(JSON.stringify({
        type: 'pairList',
        pairs: TOP_100_FOREX_PAIRS
    }));

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Connect to OANDA stream
let oandaStream = null;

function subscribeToPairs(pairs) {
    if (oandaStream) {
        oandaStream.data.destroy();
    }

    const instruments = Array.from(new Set([...pairs])).join(',');
    const url = `${OANDA_URL}?instruments=${instruments}`;

    oandaStream = axios({
        method: 'get',
        url: url,
        headers: {
            "Authorization": `Bearer ${OANDA_API_KEY}`
        },
        responseType: 'stream'
    })
        .then(response => {
            console.log(`Subscribed to ${pairs.length} forex pairs`);

            response.data.on('data', chunk => {
                const lines = chunk.toString().split('\n');

                lines.forEach(line => {
                    if (line.trim() === '') return;

                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'PRICE') {
                            // Format the price data
                            const priceData = {
                                instrument: data.instrument,
                                time: data.time,
                                bid: data.bids[0].price,
                                ask: data.asks[0].price,
                                spread: (data.asks[0].price - data.bids[0].price).toFixed(5)
                            };

                            // Update the current prices map
                            currentPrices.set(data.instrument, priceData);

                            // Broadcast individual price update
                            forexWss.clients.forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({
                                        type: 'priceUpdate',
                                        data: priceData
                                    }));
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing data:', e);
                    }
                });
            });

            response.data.on('error', err => {
                console.error('Stream error:', err);
                restartStream();
            });

            response.data.on('end', () => {
                console.log('Stream ended');
                restartStream();
            });

            return response;
        })
        .catch(err => {
            console.error('Connection error:', err);
            restartStream();
        });
}

function sendAllPrices() {
    if (currentPrices.size > 0) {
        const allPrices = Array.from(currentPrices.values());
        forexWss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'allPrices',
                    data: allPrices,
                    timestamp: new Date().toISOString()
                }));
            }
        });
    }
}




function restartStream() {
    console.log('Reconnecting in 5 seconds...');
    setTimeout(() => subscribeToPairs(TOP_100_FOREX_PAIRS), 5000);
}
