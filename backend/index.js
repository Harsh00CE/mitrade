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
import OpenOrdersModel from "./schemas/openOrderSchema.js";
import ClosedOrdersModel from "./schemas/closeOrderSchema.js";
import mongoose from "mongoose";
import DemoWalletModel from "./schemas/demoWalletSchema.js";
import ActiveWalletModel from "./schemas/activeWalletSchema.js";
import { startLiquidationService, updateCurrentPrices } from "./liquidationService.js";
import PriceHistoryModel from "./schemas/priceHistorySchema.js";


dotenv.config({ path: ".env" });

await connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

const TOP_100_FOREX_PAIRS = [
    'XAU_USD', 'XAG_USD', 'XPT_USD', 'XPD_USD', 'NATGAS_USD', 'EUR_GBP', 'USD_JPY', 'GBP_USD', 'USD_CHF', 'XAU_USD', 'XAG_USD', 'XPT_USD', 'XPD_USD', 'NATGAS_USD', 'EUR_GBP', 'USD_JPY', 'GBP_USD'
];

const TOP_100_CRYPTO_PAIRS = [
    'BTC_USD', 'ETH_USD', 'BCH_USD', 'LTC_USD', 'SOL_USD', 'DOGE_USD', 'USD_THB', 'GBP_CHF', 'EUR_JPY', 'AUD_CAD', 'NZD_USD', 'USD_CAD', 'USD_SGD', 'USD_HKD', 'USD_CZK', 'USD_DKK', 'USD_NOK', 'USD_SEK', 'USD_TRY', 'USD_ZAR'
];

const server = createServer();
const wss = new WebSocketServer({ server });

const PORT = 3001;

const OANDA_ACCOUNT_ID = '101-001-31219533-001';
const OANDA_API_KEY = '5feac4ec1ff4d5d5fa28bd53f31a2fd7-d3da8ffeb17a5a449d6f46f583f9bc4a';
const OANDA_URL = `https://stream-fxpractice.oanda.com/v3/accounts/${OANDA_ACCOUNT_ID}/pricing/stream`;

const PRICE_UPDATE_INTERVAL = 1000;
const currentPrices = new Map();


const getStartOfDay = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};


const getYesterdayClosePrice = async (symbol) => {
    try {
        // Get the start of yesterday
        const yesterdayStart = getYesterdayStart();
        // Get the start of today (which is the end of yesterday)
        const todayStart = getStartOfDay();

        // Find the last price record from yesterday
        const lastPrice = await PriceHistoryModel.findOne({
            symbol: symbol,
            timestamp: {
                $gte: yesterdayStart,
                $lt: todayStart
            }
        }).sort({ timestamp: -1 }); // Sort by timestamp descending to get the most recent

        return lastPrice ? lastPrice.close : null;
    } catch (err) {
        console.error(`Error fetching yesterday's close for ${symbol}:`, err);
        return null;
    }
};

const getYesterdayStart = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(0, 0, 0, 0);
    return date;
};

// Store daily price data in memory for quick access
const dailyPriceData = new Map();

// Initialize daily data for all pairs
function initializeDailyData() {
    TOP_100_FOREX_PAIRS.forEach(pair => {
        dailyPriceData.set(pair, {
            open: null,
            high: -Infinity,
            low: Infinity,
            close: null,
            type: 'forex'
        });
    });

    TOP_100_CRYPTO_PAIRS.forEach(pair => {
        dailyPriceData.set(pair, {
            open: null,
            high: -Infinity,
            low: Infinity,
            close: null,
            type: 'crypto'
        });
    });
}

initializeDailyData();

async function handlePriceUpdate(data) {
    const { instrument, bid, ask, type } = data;
    const midPrice = (parseFloat(bid) + parseFloat(ask)) / 2;
    const now = new Date();

    // Get or initialize daily data for this instrument
    const dailyData = dailyPriceData.get(instrument) || {
        open: null,
        high: -Infinity,
        low: Infinity,
        close: null,
        type,
        yesterdayClose: null
    };

    // If it's a new day, reset the data
    if (dailyData.lastUpdate && dailyData.lastUpdate < getStartOfDay()) {
        // Store yesterday's data before resetting
        if (dailyData.close) {
            await storeDailyPriceHistory(instrument, {
                open: dailyData.open,
                high: dailyData.high,
                low: dailyData.low,
                close: dailyData.close,
                type: dailyData.type
            });
        }

        // Set yesterday's close (which was the previous day's close)
        dailyData.yesterdayClose = dailyData.close;

        // Reset for new day
        dailyData.open = midPrice;
        dailyData.high = midPrice;
        dailyData.low = midPrice;
    } else if (dailyData.open === null) {
        // First price of the day - fetch yesterday's close if not set
        if (dailyData.yesterdayClose === null) {
            dailyData.yesterdayClose = await getYesterdayClosePrice(instrument);
        }

        dailyData.open = midPrice;
        dailyData.high = midPrice;
        dailyData.low = midPrice;
    } else {
        // Update high/low
        if (midPrice > dailyData.high) dailyData.high = midPrice;
        if (midPrice < dailyData.low) dailyData.low = midPrice;
    }

    // Always update close price with latest
    dailyData.close = midPrice;
    dailyData.lastUpdate = now;
    dailyData.type = type;

    dailyPriceData.set(instrument, dailyData);

    // Store price history every minute (adjust frequency as needed)
    if (!dailyData.lastHistoryUpdate || (now - dailyData.lastHistoryUpdate) > 60000) {
        await storePriceHistory(instrument, midPrice, type);
        dailyData.lastHistoryUpdate = now;
    }
}

// Store minute-level price history
async function storePriceHistory(symbol, price, type) {
    try {
        await PriceHistoryModel.create({
            symbol,
            timestamp: new Date(),
            open: price,
            high: price,
            low: price,
            close: price,
            type
        });
    } catch (err) {
        console.error('Error storing price history:', err);
    }
}

// Store daily summary
async function storeDailyPriceHistory(symbol, data) {
    try {
        await PriceHistoryModel.create({
            symbol,
            timestamp: getYesterdayStart(),
            ...data
        });
    } catch (err) {
        console.error('Error storing daily price history:', err);
    }
}

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

            let buffer = '';

            stream.on('data', chunk => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'PRICE') {
                            const pairType = TOP_100_FOREX_PAIRS.includes(data.instrument) ? 'forex' : 'crypto';
                            const currentPrice = (parseFloat(data.bids[0].price) + parseFloat(data.asks[0].price)) / 2;

                            // Get the daily OHLC data for this instrument
                            const dailyData = dailyPriceData.get(data.instrument) || {
                                open: currentPrice,
                                high: currentPrice,
                                low: currentPrice,
                                close: currentPrice,
                                type: pairType
                            };

                            const priceData = {
                                instrument: data.instrument,
                                time: data.time,
                                bid: data.bids[0].price,
                                ask: data.asks[0].price,
                                spread: (data.asks[0].price - data.bids[0].price).toFixed(5),
                                type: pairType,
                                ohlc: {
                                    open: dailyData.open,
                                    high: dailyData.high,
                                    low: dailyData.low,
                                    close: dailyData.close,
                                    // Optional: Include yesterday's close if available
                                    yesterdayClose: null // You can populate this from your database
                                },
                                change: dailyData.open ?
                                    ((currentPrice - dailyData.open) / dailyData.open * 100).toFixed(2) + '%' :
                                    '0.00%'
                            };

                            currentPrices.set(data.instrument, priceData);
                            updateCurrentPrices(currentPrices);
                            broadcastToAllClients(priceData);

                            handlePriceUpdate(priceData);
                            checkAndSendAlerts(data.instrument, parseFloat(priceData.bid));
                            checkTP_SL_Triggers(data.instrument, parseFloat(priceData.bid), wss);
                            checkPendingOrders(data.instrument, parseFloat(priceData.bid), wss);
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e.message, 'Line:', line);
                    }
                }

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


// startLiquidationService(wss);

function sendAllPrices() {
    if (currentPrices.size > 0) {
        const allPrices = Array.from(currentPrices.values()).map(priceData => {
            const instrument = priceData.instrument;
            const dailyData = dailyPriceData.get(instrument) || {
                open: priceData.bid,
                high: priceData.bid,
                low: priceData.bid,
                close: priceData.bid,
                yesterdayClose: null
            };

            return {
                ...priceData,
                ohlc: {
                    open: dailyData.open,
                    high: dailyData.high,
                    low: dailyData.low,
                    close: dailyData.close,
                    yesterdayClose: dailyData.yesterdayClose
                },
                change: dailyData.open ?
                    ((parseFloat(priceData.bid) - dailyData.open) / dailyData.open * 100).toFixed(2) + '%' :
                    '0.00%'
            };
        });

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
    const instrument = priceData.instrument;
    const dailyData = dailyPriceData.get(instrument) || {
        open: priceData.bid,
        high: priceData.bid,
        low: priceData.bid,
        close: priceData.bid,
        yesterdayClose: null
    };

    const enhancedPriceData = {
        ...priceData,
        ohlc: {
            open: dailyData.open,
            high: dailyData.high,
            low: dailyData.low,
            close: dailyData.close,
            yesterdayClose: dailyData.yesterdayClose
        },
        change: dailyData.yesterdayClose  ?
            ((parseFloat(priceData.bid) - dailyData.yesterdayClose) / dailyData.yesterdayClose * 100).toFixed(2) + '%' :
            '0.00%'
    };

    // wss.clients.forEach(client => {
    //     if (client.readyState === WebSocket.OPEN) {
    //         client.send(JSON.stringify({
    //             type: 'priceUpdate',
    //             data: enhancedPriceData
    //         }));
    //     }
    // });
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

const checkTP_SL_Triggers = async (symbol, currentPrice, wss) => {
    const activeTrades = await OpenOrdersModel.find({ symbol, status: "active" });

    for (const trade of activeTrades) {
        const { _id, userId, takeProfit, stopLoss, type, openingPrice, quantity, contractSize } = trade;
        let isTP = false, isSL = false;

        const entryValue = openingPrice * quantity;
        const currentValue = currentPrice * quantity;
        const profitOrLoss = type === "buy"
            ? (currentValue - entryValue) * contractSize
            : (entryValue - currentValue) * contractSize;

        if (takeProfit && takeProfit.value !== null) {
            if (takeProfit.type === 'price') {
                if ((type === 'buy' && currentPrice >= takeProfit.value) ||
                    (type === 'sell' && currentPrice <= takeProfit.value)) {
                    isTP = true;
                }
            } else if (takeProfit.type === 'profit') {
                if (profitOrLoss >= takeProfit.value) {
                    isTP = true;
                }
            }
        }

        if (stopLoss && stopLoss.value !== null) {
            if (stopLoss.type === 'price') {
                if ((type === 'buy' && currentPrice <= stopLoss.value) ||
                    (type === 'sell' && currentPrice >= stopLoss.value)) {
                    isSL = true;
                }
            } else if (stopLoss.type === 'loss') {
                if (profitOrLoss <= -Math.abs(stopLoss.value)) {
                    isSL = true;
                }
            }
        }

        // console.log("isTP:", isTP, "isSL:", isSL, "currentPrice:", currentPrice, "TP:", takeProfit, "SL:", stopLoss);

        if (!isTP && !isSL) continue;

        const openOrder = await OpenOrdersModel.findOneAndDelete({ _id, status: "active" }).lean();
        if (!openOrder) continue;

        const closingValue = currentPrice * openOrder.quantity;
        let realisedPL = openOrder.type === "buy"
            ? closingValue - entryValue
            : entryValue - closingValue;

        realisedPL = parseFloat((realisedPL * openOrder.contractSize).toFixed(2));
        // console.log("Realised P/L:", realisedPL);

        // Create Closed Order
        const closedOrder = new ClosedOrdersModel({
            originalOrderId: _id,
            orderId: new mongoose.Types.ObjectId().toString(),
            userId: openOrder.userId,
            symbol: openOrder.symbol,
            contractSize: openOrder.contractSize,
            type: openOrder.type,
            quantity: openOrder.quantity,
            openingPrice: openOrder.openingPrice,
            closingPrice: currentPrice,
            leverage: openOrder.leverage,
            status: "closed",
            position: "close",
            openingTime: openOrder.openingTime,
            closingTime: new Date(),
            realisedPL,
            margin: openOrder.margin,
            tradingAccount: openOrder.tradingAccount || "demo",
            closeReason: isTP ? "take-profit" : "stop-loss"
        });

        if (openOrder.stopLoss?.type) {
            closedOrder.stopLoss = openOrder.stopLoss;
        }

        if (openOrder.takeProfit?.type) {
            closedOrder.takeProfit = openOrder.takeProfit;
        }


        const user = await UserModel.findById(openOrder.userId)

        if (!user || !user.demoWallet) {
            res.status(200).json({
                success: false,
                message: "User or wallet not found"
            });
        }

        if (!user.walletType) {
            res.status(200).json({
                success: false,
                message: "User wallet type not found",
            })
        }

        if (!user.demoWallet && !user.activeWallet) {
            res.status(200).json({
                success: false,
                message: "User wallet not found",
            })
        }

        const walletType = user.walletType;
        let wallet;

        if (walletType === "demo") {
            wallet = await DemoWalletModel.findById(user.demoWallet);
        } else {
            wallet = await ActiveWalletModel.findById(user.activeWallet);
        }

        if (!wallet) continue;

        // Update wallet
        wallet.balance = parseFloat((wallet.balance + realisedPL).toFixed(2));

        wallet.available = parseFloat((wallet.available + realisedPL + openOrder.margin).toFixed(2));

        wallet.margin = parseFloat((wallet.margin - openOrder.margin).toFixed(2));

        wallet.equity = parseFloat((wallet.equity + realisedPL).toFixed(2));

        await Promise.all([
            closedOrder.save(),
            wallet.save(),
            UserModel.updateOne(
                { _id: openOrder.userId },
                {
                    $push: { closedOrders: closedOrder.orderId },
                    $pull: { openOrders: _id }
                }
            )
        ]);

        // WebSocket notification
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    type: 'tradeClosed',
                    data: {
                        tradeId: _id,
                        symbol,
                        price: currentPrice,
                        reason: isTP ? 'TP' : 'SL',
                        realisedPL
                    }
                }));
            }
        });

        console.log(`Closed Order: ${symbol} @ ${currentPrice} for ${isTP ? "TP" : "SL"}`);
    }
};

const getISTDate = () => {
    const now = new Date();
    const istOffset = 5.5 * 60;
    return new Date(now.getTime() + istOffset * 60 * 1000);
};


const checkPendingOrders = async (symbol, currentPrice, wss) => {

    const pendingOrders = await OpenOrdersModel.find({
        symbol,
        status: "pending",
        "pendingValue": { $ne: null }
    });
    for (const order of pendingOrders) {
        const { _id, userId, type, quantity, contractSize, leverage, margin, tradingAccount, pendingValue } = order;

        if (!pendingValue) continue;

        const triggerType = type;
        const triggerPrice = pendingValue;

        let shouldTrigger = false;

        if (triggerType == 'buy' && currentPrice <= triggerPrice) {
            shouldTrigger = true;
        }

        if (triggerType == 'sell' && currentPrice >= triggerPrice) {
            shouldTrigger = true;
        }
        // console.log("Trigger Type:", triggerType, "Current Price:", currentPrice, "Pending Trigger Price:", triggerPrice, "Should Trigger:", shouldTrigger);



        if (!shouldTrigger) continue;

        const updatedOrder = await OpenOrdersModel.findByIdAndUpdate(
            _id,
            {
                status: "active",
                openingPrice: currentPrice,
                openingTime: getISTDate(),
                $unset: { pending: "" }
            },
            { new: true }
        ).lean();

        // Update user's wallet: only if demo account (you can add real account logic similarly)
        if (tradingAccount === "demo") {
            const user = await UserModel.findById(userId)
            if (!user) continue;

            if (!user || !user.demoWallet) {
                res.status(200).json({
                    success: false,
                    message: "User or wallet not found"
                });
            }

            if (!user.walletType) {
                res.status(200).json({
                    success: false,
                    message: "User wallet type not found",
                })
            }

            if (!user.demoWallet && !user.activeWallet) {
                res.status(200).json({
                    success: false,
                    message: "User wallet not found",
                })
            }

            const walletType = user.walletType;
            let wallet;

            if (walletType === "demo") {
                wallet = await DemoWalletModel.findById(user.demoWallet);
            } else {
                wallet = await ActiveWalletModel.findById(user.activeWallet);
            }


            if (!wallet || wallet.available < margin) {
                console.log(`Insufficient margin for user ${userId}`);
                res.status(200).json({
                    success: false,
                    message: "Insufficient available balance",
                });
                continue;
            }

            wallet.available = parseFloat((wallet.available - margin).toFixed(2));
            wallet.margin = parseFloat((wallet.margin + margin).toFixed(2));
            await wallet.save();
        }

        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    type: 'tradeActivated',
                    data: {
                        tradeId: updatedOrder._id,
                        userId,
                        symbol,
                        quantity,
                        leverage,
                        openingPrice: currentPrice,
                        margin,
                        accountType: tradingAccount,
                        time: getISTDate(),
                        positionType: type,
                    }
                }));
            }
        });

        console.log(`[✓] Activated pending order ${_id} at price ${currentPrice}`);
    }
};

// // Add to your WebSocket server
// function broadcastOHLCUpdates() {
//     const ohlcData = {};

//     for (const [symbol, data] of dailyPriceData.entries()) {
//         ohlcData[symbol] = {
//             open: data.open,
//             high: data.high,
//             low: data.low,
//             close: data.close,
//             type: data.type
//         };
//     }

//     wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify({
//                 type: 'ohlcUpdate',
//                 data: ohlcData,
//                 timestamp: new Date().toISOString()
//             }));
//         }
//     });
// }

// // Call this periodically (e.g., every minute)
// setInterval(broadcastOHLCUpdates, 1000);


const checkForLiquidations = async (wss) => {
    try {
        // Get all users with open positions
        const usersWithOpenPositions = await UserModel.find()


        for (const user of usersWithOpenPositions) {
            const walletType = user.walletType;
            let wallet;

            if (walletType === "demo") {
                wallet = await DemoWalletModel.findById(user.demoWallet);
            } else {
                wallet = await ActiveWalletModel.findById(user.activeWallet);
            }


            if (!wallet) continue;

            // Recalculate available balance based on current prices
            const openOrders = await OpenOrdersModel.find({
                userId: user._id,
                status: "active"
            });

            let totalUnrealizedPL = 0;

            for (const order of openOrders) {
                const currentPriceData = currentPrices.get(order.symbol);
                if (!currentPriceData) continue;

                const currentPrice = parseFloat(currentPriceData.bid);
                const entryValue = order.openingPrice * order.quantity;
                const currentValue = currentPrice * order.quantity;

                const unrealizedPL = order.type === "buy"
                    ? (currentValue - entryValue) * order.contractSize
                    : (entryValue - currentValue) * order.contractSize;

                totalUnrealizedPL += unrealizedPL;
            }
            wallet.equity = parseFloat((wallet.balance + totalUnrealizedPL).toFixed(2));
            wallet.available = parseFloat((wallet.equity - wallet.margin).toFixed(2));

            if (wallet.available <= 0) {
                // console.log(`Liquidating all positions for user ${user._id} due to negative available balance`);
                await liquidateAllPositions(user._id, wallet, wss);
            } else {
                await wallet.save();
            }
        }
    } catch (error) {
        console.error('Error in liquidation check:', error);
    }
};
const liquidateAllPositions = async (userId, wallet, wss) => {


    try {
        const activeOrders = await OpenOrdersModel.find({
            userId,
            status: "active"
        });

        for (const order of activeOrders) {
            const currentPriceData = currentPrices.get(order.symbol);
            if (!currentPriceData) continue;

            const currentPrice = parseFloat(currentPriceData.bid);
            const entryValue = order.openingPrice * order.quantity;
            const currentValue = currentPrice * order.quantity;

            let realisedPL = order.type === "buy"
                ? (currentValue - entryValue) * order.contractSize
                : (entryValue - currentValue) * order.contractSize;

            realisedPL = parseFloat(realisedPL.toFixed(2));
            const closedOrder = new ClosedOrdersModel({
                originalOrderId: order._id,
                orderId: new mongoose.Types.ObjectId().toString(),
                userId: order.userId,
                symbol: order.symbol,
                contractSize: order.contractSize,
                type: order.type,
                quantity: order.quantity,
                openingPrice: order.openingPrice,
                closingPrice: currentPrice,
                leverage: order.leverage,
                status: "closed",
                position: "close",
                openingTime: order.openingTime,
                closingTime: new Date(),
                realisedPL,
                margin: order.margin,
                tradingAccount: order.tradingAccount || "demo",
                closeReason: "liquidation"
            });
            if (order.stopLoss.type) {
                closedOrder.stopLoss = order.stopLoss;
            }

            if (order.takeProfit.type) {
                closedOrder.takeProfit = order.takeProfit;
            }


            await closedOrder.save();

            await OpenOrdersModel.findByIdAndDelete(order._id);

            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: 'tradeClosed',
                        data: {
                            tradeId: order._id,
                            symbol: order.symbol,
                            price: currentPrice,
                            reason: 'liquidation',
                            realisedPL
                        }
                    }));
                }
            });
        }

        wallet.balance = 0;
        wallet.available = 0;
        wallet.margin = 0;
        wallet.equity = 0;
        await wallet.save();

        await UserModel.updateOne(
            { _id: userId },
            {
                $set: { openOrders: [] },
                $push: { closedOrders: { $each: activeOrders.map(o => o._id) } }
            },
        );

        // console.log(`Successfully liquidated all positions for user ${userId}`);
    } catch (error) {
        console.error('Error during liquidation:', error);
    }
};