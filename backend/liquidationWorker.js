import { parentPort, workerData } from 'worker_threads';
import mongoose from 'mongoose';
import UserModel from './schemas/userSchema.js';
import OpenOrdersModel from './schemas/openOrderSchema.js';
import ClosedOrdersModel from './schemas/closeOrderSchema.js';
import DemoWalletModel from './schemas/demoWalletSchema.js';
import ActiveWalletModel from './schemas/activeWalletSchema.js';

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);

const liquidateAllPositions = async (userId, wallet, openOrders, currentPrices) => {
    try {
        const activeOrders = openOrders;
        let closedOrders = [];
        let openOrdersToDelete = [];
        let updatedWallet = {};

        for (const order of activeOrders) {
            const currentPriceData = currentPrices.get(order.symbol);
            if (!currentPriceData) continue;

            const currentPrice = parseFloat(currentPriceData.bid);
            const entryValue = order.openingPrice;
            const currentValue = currentPrice;

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
                closingPrice: currentPrice,
                leverage: order.leverage,
                status: "closed",
                position: "close",
                openingTime: order.openingTime,
                closingTime: new Date(),
                realisedPL: realisedPL,
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

            await UserModel.updateOne(
                { _id: new mongoose.Types.ObjectId(userId) },
                {
                    $set: { orderList: [] },
                    $push: { orderHistory: { $each: activeOrders.map(o => o._id) } }
                }
            );
        }

        return { closedOrders, openOrdersToDelete, updatedWallet };
    } catch (error) {
        console.error('Error during liquidation:', error);
        throw error;
    }
};

async function processUserLiquidation(user) {
    try {
        let wallet, totalUnrealizedPL = 0;
        const currentPrices = new Map(workerData.currentPrices);

        if (user.walletType === "demo") {
            wallet = await DemoWalletModel.findById(user.demoWallet);
        } else {
            wallet = await ActiveWalletModel.findById(user.activeWallet);
        }

        if (!wallet || wallet.available == 0) return null;

        const orders = await OpenOrdersModel.find({
            userId: user._id,
            status: "active"
        });

        if (!orders.length) return null;

        for (const order of orders) {
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

        const available = parseFloat((wallet.available + totalUnrealizedPL).toFixed(2));
        const liquidationStatus = user.liquidated;

        console.log("available ==> ", available);


        if (available <= 0 && liquidationStatus === false) {
            await UserModel.updateOne(
                { _id: user._id },
                { $set: { liquidated: true } }
            );

            const { closedOrders, openOrdersToDelete, updatedWallet } =
                await liquidateAllPositions(user._id, wallet, orders, currentPrices);

            return {
                userId: user._id,
                closedOrders,
                openOrdersToDelete,
                updatedWallet,
                walletType: user.walletType
            };
        }

        return null;
    } catch (error) {
        console.error(`Error processing user ${user._id}:`, error);
        return null;
    }
}

async function main() {
    try {
        const users = workerData.users;
        const results = [];

        for (const user of users) {
            const result = await processUserLiquidation(user);
            if (result) {
                results.push(result);
            }
        }

        parentPort.postMessage({ results });
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    } finally {
        await mongoose.connection.close();
    }
}

await main();










// Remove the duplicate liquidateAllPositions function from this file
// Keep all other functions except the worker-related ones

async function checkForLiquidations(wss) {
    try {
        const openOrdersUsers = await OpenOrdersModel.find({
            status: "active"
        }).distinct("userId");

        if (!openOrdersUsers.length) return;

        const users = await UserModel.find({
            _id: { $in: openOrdersUsers }
        }).select('_id walletType demoWallet activeWallet liquidated');

        if (!users.length) return;

        // Split users into chunks for each worker
        const chunkSize = Math.ceil(users.length / NUM_CPUS);
        const userChunks = [];
        for (let i = 0; i < users.length; i += chunkSize) {
            userChunks.push(users.slice(i, i + chunkSize));
        }

        const workers = [];
        const results = [];

        for (const chunk of userChunks) {
            const worker = new Worker('./liquidationWorker.js', {
                workerData: {
                    users: chunk,
                    currentPrices: Array.from(currentPrices.entries())
                },
                type: 'module' // This is crucial for ES modules
            });

            workers.push(new Promise((resolve, reject) => {
                worker.on('message', (message) => {
                    if (message.error) {
                        console.error('Worker error:', message.error);
                        reject(message.error);
                    } else if (message.results) {
                        results.push(...message.results);
                        resolve();
                    }
                });
                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Worker stopped with exit code ${code}`));
                    }
                });
            }));
        }

        await Promise.all(workers);

        // Process results
        for (const result of results) {
            if (!result) continue;

            // Update database with liquidation results
            await Promise.all([
                ClosedOrdersModel.bulkWrite(result.closedOrders),
                OpenOrdersModel.bulkWrite(result.openOrdersToDelete),
                result.walletType === 'demo'
                    ? DemoWalletModel.updateOne(
                        { _id: result.updatedWallet._id },
                        { $set: result.updatedWallet }
                    )
                    : ActiveWalletModel.updateOne(
                        { _id: result.updatedWallet._id },
                        { $set: result.updatedWallet }
                    )
            ]);

            // Notify clients
            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: 'liquidation',
                        data: { userId: result.userId }
                    }));
                }
            });
        }

    } catch (error) {
        console.error('Error in liquidation check:', error);
    }
}