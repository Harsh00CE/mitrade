import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import ClosedOrdersModel from "../schemas/closeOrderSchema.js";
import mongoose from "mongoose";




const router = express.Router();


const fetchOandaPrice = async (symbol) => {
    const accountId = process.env.OANDA_ACCOUNT_ID;
    const token = process.env.OANDA_API_KEY;

    const url = `https://api-fxpractice.oanda.com/v3/accounts/${accountId}/pricing?instruments=${symbol}`;
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        const res = await fetch(url, { headers });
        const data = await res.json();

        if (!data.prices || data.prices.length === 0) return null;

        const priceInfo = data.prices[0];
        const bid = parseFloat(priceInfo.bids[0].price);
        const ask = parseFloat(priceInfo.asks[0].price);
        const mid = (bid + ask) / 2;

        return mid;
    } catch (error) {
        console.error("OANDA price fetch error:", error);
        return null;
    }
};

router.post("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await UserModel.findById(userId);
        if (!user || !user.walletType || (!user.demoWallet && !user.activeWallet)) {
            return res.status(200).json({
                success: false,
                message: "User or wallet not found",
            });
        }

        const walletType = user.walletType;
        const wallet = walletType === "demo"
            ? await DemoWalletModel.findById(user.demoWallet)
            : await ActiveWalletModel.findById(user.activeWallet);

        if (!wallet) {
            return res.status(200).json({
                success: false,
                message: "Wallet not found",
            });
        }

        const openOrders = await OpenOrdersModel.find({ userId: userId, position: "open" });

        if (!openOrders.length) {
            return res.status(200).json({
                success: false,
                message: "No open orders to liquidate",
            });
        }

        let totalRealisedPL = 0;

        for (const order of openOrders) {
            const closingPrice = await fetchOandaPrice(order.symbol);

            console.log(
                "Closing price for order:",
                order.symbol,
                "at price:",
                closingPrice
            );


            if (!closingPrice) {
                res.status(200).json({
                    success: false,
                    message: "Error fetching closing price",
                });
                continue;
            }

            const openingValue = order.openingPrice * order.quantity;
            const closingValue = closingPrice * order.quantity;
            let realisedPL = order.type === "buy"
                ? closingValue - openingValue
                : openingValue - closingValue;

            realisedPL = parseFloat((realisedPL * order.contractSize).toFixed(2));
            totalRealisedPL += realisedPL;
            totalRealisedPL = parseFloat((totalRealisedPL).toFixed(2));

            // Remove from open orders
            await OpenOrdersModel.findByIdAndDelete(order._id);

            console.log("order -> ", order);

            console.log("realisedPL -> ", realisedPL);


            // Create a closed order entry
            const closedOrder = new ClosedOrdersModel({
                originalOrderId: order._id,
                orderId: new mongoose.Types.ObjectId().toString(),
                userId: order.userId,
                symbol: order.symbol,
                contractSize: order.contractSize,
                type: order.type,
                quantity: order.quantity,
                openingPrice: order.openingPrice,
                closingPrice,
                leverage: order.leverage,
                status: "closed",
                position: "close",
                openingTime: order.openingTime,
                closingTime: new Date(),
                realisedPL,
                margin: order.margin,
                tradingAccount: walletType,
                closeReason: "liquidation"
            });

            if (order.stopLoss.type) {
                closedOrder.stopLoss = order.stopLoss;
            }

            if (order.takeProfit.type) {
                closedOrder.takeProfit = order.takeProfit;
            }


            await closedOrder.save();

            await UserModel.updateOne(
                { _id: userId },
                {
                    $push: { closedOrders: closedOrder.orderId },
                    $pull: { openOrders: order._id }
                }
            );
        }

        // Reset wallet
        wallet.balance = 0;
        wallet.available = 0;
        wallet.equity = 0;
        wallet.margin = 0;
        await wallet.save();

        return res.status(200).json({
            success: true,
            message: "User liquidated successfully",
            data: {
                closedOrders: openOrders.length,
                totalRealisedPL,
                updatedBalance: wallet.balance,
                updatedAvailable: wallet.available,
            },
        });
    } catch (error) {
        console.error("Error liquidating user:", error);
        return res.status(200).json({
            success: false,
            message: "Internal server error",
        });
    }
});


export default router;