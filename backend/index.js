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
import mongoose, { set } from "mongoose";
import DemoWalletModel from "./schemas/demoWalletSchema.js";
import ActiveWalletModel from "./schemas/activeWalletSchema.js";
import { Worker } from "worker_threads";
import os from "os";

import { startLiquidationService, updateCurrentPrices } from "./liquidationService.js";
import { log } from "console";




const NUM_CPUS = os.cpus().length;


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

const PORT = process.env.SOCKET_PORT || 3001;

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

            let buffer = '';

            stream.on('data', async chunk => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
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
                            // updateCurrentPrices(currentPrices);
                            // broadcastToAllClients(priceData);

                            // checkForLiquidations(wss);

                            // if (Math.random() < 0.2) { // 20% chance to run liquidation check
                            //     checkForLiquidations(wss).catch(console.error);
                            // }

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
        console.log("Realised P/L:", realisedPL);

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
        // let wallet;

        const walletModel = user.walletType === "demo" ? DemoWalletModel : ActiveWalletModel;
        const walletId = user.walletType === "demo" ? user.demoWallet : user.activeWallet;
        const wallet = await walletModel.findById(walletId);

        log("wallet", wallet);

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
        let { _id, userId, type, quantity, contractSize, leverage, margin, tradingAccount, pendingValue } = order;

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
let totalUnrealizedPL = 0;

        const activeOrders = await OpenOrdersModel.find({
            status: "active", position: 'open'
        }).distinct("userId");


        if (!activeOrders.length) {
            continue;
        }

        for (const order of activeOrders) {

            const currentPriceData = currentPrices.get(order.symbol);

            if (!currentPriceData) continue;

            const currentPrice = parseFloat(currentPriceData.bid);
            const entryValue = order.openingPrice;
            const currentValue = currentPrice;

            const unrealizedPL = order.type === "buy"
                ? (currentValue - entryValue) * order.contractSize * order.quantity
                : (entryValue - currentValue) * order.contractSize * order.quantity;

            totalUnrealizedPL += unrealizedPL;
        }

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

            const newAvailableBalance = parseFloat((wallet.available + totalUnrealizedPL).toFixed(2));
            
            if (newAvailableBalance < margin) {
                console.log(`Insufficient margin for user ${userId}`);
                res.status(200).json({
                    success: false,
                    message: "Insufficient available balance",
                });
                continue;
            }

const currentAvailable = parseFloat(wallet.available) || 0;
            const currentMargin = parseFloat(wallet.margin) || 0;

            if (newAvailableBalance > margin) {
                wallet.available = parseFloat((currentAvailable - margin).toFixed(2));
            wallet.margin = parseFloat((currentMargin + margin).toFixed(2));
            } else if (newAvailableBalance <= margin && newAvailableBalance > 0) {
                margin = parseFloat(newAvailableBalance);
                wallet.available = parseFloat((currentAvailable - margin).toFixed(2));
                wallet.margin = parseFloat((currentMargin + margin).toFixed(2));
            } else {
                margin = 0;
                wallet.available = 0;
            }

            // wallet.available = parseFloat((wallet.available - margin).toFixed(2));
            // wallet.margin = parseFloat((wallet.margin + margin).toFixed(2));
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

const checkForLiquidations = async (wss) => {
    try {
        let pair = new Map();
        let liquidationStart = new Map();

        const openOrders = await OpenOrdersModel.find({
            status: "active"
        }).distinct("userId");

        if (!openOrders.length) {
            return;
        }

        const get_users_with_orders = await UserModel.find({
            _id: { $in: openOrders }
        }).populate("orderList demoWallet activeWallet");


        if (!get_users_with_orders.length) {
            return;
        }

        for (const single_user of get_users_with_orders) {
            let wallet, totalUnrealizedPL = 0;




            if (single_user.walletType === "demo") {
                wallet = single_user.demoWallet;
            } else {
                wallet = single_user.activeWallet;
            }

            if (!wallet) continue;
            if (wallet.available == 0) continue;


            if (!single_user.orderList.length) {
                continue;
            }

            for (const single_order of single_user.orderList) {
                const currentPriceData = currentPrices.get(single_order.symbol);

                if (!currentPriceData) continue;

                const currentPrice = parseFloat(currentPriceData.bid)

                const entryValue = single_order.openingPrice
                const currentValue = currentPrice

                const unrealizedPL = single_order.type === "buy"
                    ? (currentValue - entryValue) * single_order.contractSize * single_order.quantity
                    : (entryValue - currentValue) * single_order.contractSize * single_order.quantity;;

                totalUnrealizedPL += unrealizedPL;

                pair.set(single_order.symbol, currentPrice);
            }

            const available = parseFloat((wallet.available + totalUnrealizedPL).toFixed(2));

            console.log("available ==> ", available);
            const userIdStr = single_user._id.toString();

            const find_user = await UserModel.findById(single_user._id);
            const liquidationStatus = find_user.liquidated;

            if (available <= 0 && liquidationStatus === false) {
                await UserModel.updateOne(
                    { _id: single_user._id },
                    {
                        $set: { liquidated: true },
                    },
                );
                const { closedOrders, openOrdersToDelete, updatedWallet } = await liquidateAllPositions(single_user._id, wallet, wss, single_user.orderList, pair);
                await OpenOrdersModel.bulkWrite(openOrdersToDelete);
                await ClosedOrdersModel.bulkWrite(closedOrders);

                if (single_user.walletType === "demo") {
                    await DemoWalletModel.updateOne(
                        { userId: new mongoose.Types.ObjectId(single_user._id) },
                        {
                            $set: updatedWallet
                        },
                    );
                } else {
                    await ActiveWalletModel.updateOne(
                        { userId: new mongoose.Types.ObjectId(single_user._id) },
                        {
                            $set: updatedWallet
                        },
                    );
                }
            } else {
                pair = new set();
            }
        }
        console.log("checkForLiquidations end")

    } catch (error) {
        console.error('Error in liquidation check:', error);
    }
};

const liquidateAllPositions = async (userId, wallet, wss, openOrders, pair) => {
    try {
        console.log("liquidateAllPositions start")
        const activeOrders = openOrders;
        let closedOrders = [];
        let openOrdersToDelete = [];
        let updatedWallet = {};

        for (const order of activeOrders) {
            console.log("🚀 ~ liquidateAllPositions ~ order:", order)
            console.log("🚀 ~ liquidateAllPositions ~ order.symbol:", order.symbol)
            const currentPrice = pair.get(order.symbol);
            console.log("currentPrice", currentPrice)
            if (!currentPrice) continue;

            const entryValue = order.openingPrice;
            const currentValue = currentPrice

            let realisedPL = order.type === "buy"
                ? (currentValue - entryValue) * order.contractSize * order.quantity
                : (entryValue - currentValue) * order.contractSize * order.quantity;

            realisedPL = parseFloat(realisedPL.toFixed(2));

            const closedOrderDoc = {
                originalOrderId: order._id,
                orderId: new mongoose.Types.ObjectId().toString(),
                userId: userId,
                symbol: order.symbol,
                contractSize: order.contractSize,
                type: order.type,
                quantity: order.quantity,
                openingPrice: order.openingPrice,
                closingPrice: currentPrice, // assuming you have this
                leverage: order.leverage,
                status: "closed",
                position: "close",
                openingTime: order.openingTime,
                closingTime: new Date(),
                realisedPL: realisedPL, // your custom function
                margin: order.margin,
                tradingAccount: order.tradingAccount || "demo",
                closeReason: "liquidation"
            };

            if (order.stopLoss?.type) {
                closedOrderDoc.stopLoss = order.stopLoss;
            }

            if (order.takeProfit?.type) {
                closedOrderDoc.takeProfit = order.takeProfit;
            }

            closedOrders.push({
                insertOne: {
                    document: closedOrderDoc
                }
            });

            openOrdersToDelete.push({
                deleteOne: {
                    filter: { _id: order._id }
                }
            });

            updatedWallet = {
                _id: wallet._id,
                balance: 0,
                equity: 0,
                available: 0,
                margin: 0,
            };

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

            await UserModel.updateOne(
                { _id: new mongoose.Types.ObjectId(userId) },
                {
                    $set: { orderList: [] },
                    $push: { orderHistory: { $each: activeOrders.map(o => o._id) } }
                },
            );

        }

        console.log("liquidateAllPositions end", closedOrders, openOrdersToDelete, updatedWallet)
        return { closedOrders, openOrdersToDelete, updatedWallet };
    } catch (error) {
        console.error('Error during liquidation:', error);
    }
};




