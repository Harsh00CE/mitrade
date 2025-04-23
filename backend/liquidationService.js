import mongoose from 'mongoose';
import UserModel from './schemas/userSchema.js';
import DemoWalletModel from './schemas/demoWalletSchema.js';
import ActiveWalletModel from './schemas/activeWalletSchema.js';
import OpenOrdersModel from './schemas/openOrderSchema.js';
import ClosedOrdersModel from './schemas/closeOrderSchema.js';

// Configuration
const LIQUIDATION_CHECK_INTERVAL = 1000;
const BATCH_SIZE = 50;
const LIQUIDATION_THRESHOLD = 0;

// Cache for user wallets
const walletCache = new Map();

// Initialize the service
let isProcessing = false;
let liquidationInterval;
let currentPricesMap = new Map();

export function updateCurrentPrices(newPrices) {
    currentPricesMap = newPrices;
}

export async function checkLiquidations(wss) {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const startTime = Date.now();
        const usersWithPositions = await UserModel.aggregate([
            {
                $lookup: {
                    from: 'openorders',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$userId', '$$userId'] },
                                status: 'active'
                            }
                        },
                        { $project: { _id: 1, symbol: 1, type: 1, quantity: 1, openingPrice: 1, contractSize: 1 } }
                    ],
                    as: 'openOrders'
                }
            },
            {
                $match: {
                    'openOrders.0': { $exists: true }
                }
            },
            {
                $project: {
                    _id: 1,
                    walletType: 1,
                    demoWallet: 1,
                    activeWallet: 1,
                    openOrders: 1
                }
            }
        ]);

        for (let i = 0; i < usersWithPositions.length; i += BATCH_SIZE) {
            const batch = usersWithPositions.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(user => processUserLiquidation(user, wss)));
        }

        console.log(`[Liquidation] Check completed in ${Date.now() - startTime}ms`);
    } catch (error) {
        console.error('[Liquidation] Error during batch check:', error);
    } finally {
        isProcessing = false;
    }
}

async function processUserLiquidation(user, wss) {
    try {
        let wallet = walletCache.get(user._id.toString());
        if (!wallet) {
            wallet = user.walletType === 'demo'
                ? await DemoWalletModel.findById(user.demoWallet).lean()
                : await ActiveWalletModel.findById(user.activeWallet).lean();
            if (wallet) walletCache.set(user._id.toString(), wallet);
        }
        if (!wallet) return;

        // Skip if already at zero balance (no active positions should exist in this case)
        if (wallet.balance <= 0 && wallet.available <= 0) {
            return;
        }

        const { equity, available, shouldLiquidate } = await calculateUserEquity(user, wallet);

        if (shouldLiquidate) {
            await liquidateUser(user._id, wallet, wss);
            walletCache.delete(user._id.toString());
        } else if (Math.abs(equity - (wallet.equity || 0)) > 0.01) {
            await updateWalletEquity(user, wallet, equity);
            walletCache.set(user._id.toString(), { ...wallet, equity });
        }
    } catch (error) {
        console.error(`[Liquidation] Error processing user ${user._id}:`, error);
    }
}

async function calculateUserEquity(user, wallet) {
    let totalUnrealizedPL = 0;
    let positionsCount = 0;

    for (const order of user.openOrders) {
        const priceData = currentPricesMap.get(order.symbol);
        if (!priceData) continue;

        const currentPrice = parseFloat(priceData.bid);
        const entryValue = order.openingPrice * order.quantity;
        const currentValue = currentPrice * order.quantity;

        totalUnrealizedPL += order.type === 'buy'
            ? (currentValue - entryValue) * order.contractSize
            : (entryValue - currentValue) * order.contractSize;

        positionsCount++;
    }

    const equity = parseFloat((wallet.balance + totalUnrealizedPL).toFixed(3));
    const available = parseFloat((equity - wallet.margin).toFixed(3));

    // Only liquidate if available drops to/below zero from a positive value
    const shouldLiquidate = (wallet.available > 0 && available <= LIQUIDATION_THRESHOLD) && positionsCount > 0;

    return { equity, available, shouldLiquidate };
}

async function updateWalletEquity(user, wallet, newEquity) {
    const update = {
        equity: newEquity,
        available: parseFloat((newEquity - wallet.margin).toFixed(3))
    };

    const model = user.walletType === 'demo' ? DemoWalletModel : ActiveWalletModel;
    await model.updateOne({ _id: wallet._id }, { $set: update });
}

async function liquidateUser(userId, wallet, wss) {

    try {
        const activeOrders = await OpenOrdersModel.find(
            { userId, status: 'active' },
            null,

        ).lean();

        if (activeOrders.length === 0) {
            return;
        }

        const closedOrders = [];
        const deleteOrderIds = [];

        for (const order of activeOrders) {
            const priceData = currentPricesMap.get(order.symbol);
            if (!priceData) continue;

            const currentPrice = parseFloat(priceData.bid);
            const entryValue = order.openingPrice * order.quantity;
            const currentValue = currentPrice * order.quantity;

            const realisedPL = parseFloat((order.type === 'buy'
                ? (currentValue - entryValue) * order.contractSize
                : (entryValue - currentValue) * order.contractSize).toFixed(3));

            closedOrders.push({
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
                status: 'closed',
                position: 'close',
                openingTime: order.openingTime,
                closingTime: new Date(),
                realisedPL,
                margin: order.margin,
                tradingAccount: order.tradingAccount,
                closeReason: 'liquidation'
            });

            if (order.stopLoss != null) {
                closedOrders[closedOrders.length - 1].stopLoss = order.stopLoss;
            }

            if (order.takeProfit != null) {
                closedOrders[closedOrders.length - 1].takeProfit = order.takeProfit;
            }



            deleteOrderIds.push(order._id);
        }

        if (closedOrders.length > 0) {
            await ClosedOrdersModel.insertMany(closedOrders);
            await OpenOrdersModel.deleteMany({ _id: { $in: deleteOrderIds } });

            const walletUpdate = {
                balance: 0,
                equity: 0,
                available: 0,
                margin: 0
            };

            const walletModel = wallet.walletType === 'demo' ? DemoWalletModel : ActiveWalletModel;
            await walletModel.updateOne({ _id: wallet._id }, { $set: walletUpdate });

            await UserModel.updateOne(
                { _id: userId },
                {
                    $pull: { orderList: { $in: deleteOrderIds } },
                    $push: { orderHistory: { $each: closedOrders.map(o => o.orderId) } }
                },
            );

            notifyLiquidation(wss, userId, closedOrders);
        }
    } catch (error) {
        console.error(`[Liquidation] Error liquidating user ${userId}:`, error);
        throw error;
    }
}

function notifyLiquidation(wss, userId, closedOrders) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'liquidation',
                userId,
                count: closedOrders.length,
                timestamp: new Date().toISOString()
            }));
        }
    });
}

export function startLiquidationService(wss) {
    setTimeout(() => {
        checkLiquidations(wss);
        liquidationInterval = setInterval(() => checkLiquidations(wss), LIQUIDATION_CHECK_INTERVAL);
    }, 1000);
}

export function stopLiquidationService() {
    if (liquidationInterval) clearInterval(liquidationInterval);
    walletCache.clear();
}