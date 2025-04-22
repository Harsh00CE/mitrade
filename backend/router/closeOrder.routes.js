import express from "express";
import mongoose from "mongoose";
import ClosedOrdersModel from "../schemas/closeOrderSchema.js";
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import UserModel from "../schemas/userSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { orderId, closingPrice } = req.body;

        // Validate inputs
        if (!mongoose.Types.ObjectId.isValid(orderId) || typeof closingPrice !== "number") {
            return res.status(200).json({ success: false, message: "Invalid input" });
        }

        // Find and delete the open order
        const openOrder = await OpenOrdersModel.findOneAndDelete({ _id: orderId, status: "active" });

        if (!openOrder) {
            const alreadyClosed = await ClosedOrdersModel.exists({ originalOrderId: orderId }).lean();
            return res.status(alreadyClosed ? 200 : 404).json({
                success: false,
                message: alreadyClosed ? "Order already closed" : "Active order not found"
            });
        }

        // Calculate P&L
        const openingValue = openOrder.openingPrice * openOrder.quantity;
        const closingValue = closingPrice * openOrder.quantity;
        let realisedPL = (openOrder.type === "buy")
            ? closingValue - openingValue
            : openingValue - closingValue;

        realisedPL = parseFloat((realisedPL * openOrder.contractSize).toFixed(2));

        // Prepare closed order data
        const closedOrderData = {
            originalOrderId: orderId,
            orderId: new mongoose.Types.ObjectId().toString(),
            userId: openOrder.userId,
            symbol: openOrder.symbol,
            contractSize: openOrder.contractSize,
            type: openOrder.type,
            quantity: openOrder.quantity,
            openingPrice: openOrder.openingPrice,
            closingPrice,
            leverage: openOrder.leverage,
            status: "closed",
            position: "close",
            openingTime: openOrder.openingTime,
            closingTime: new Date(),
            realisedPL,
            margin: openOrder.margin,
            tradingAccount: openOrder.tradingAccount || "demo",
            closeReason: "manual"
        };

        console.log("stoploss", openOrder.stopLoss);
        console.log("takeprofit", openOrder.takeProfit);


        // if (openOrder.stopLoss && typeof openOrder.stopLoss === "object") {
        //     closedOrderData.stopLoss = {
        //         type: openOrder.stopLoss.type || null,
        //         value: openOrder.stopLoss.value ?? null
        //     };
        // }

        // if (openOrder.takeProfit && typeof openOrder.takeProfit === "object") {
        //     closedOrderData.takeProfit = {
        //         type: openOrder.takeProfit.type || null,
        //         value: openOrder.takeProfit.value ?? null
        //     };
        // }


        const closedOrder = new ClosedOrdersModel(closedOrderData);

        // Get user and wallet
        const user = await UserModel.findById(openOrder.userId).lean();

        if (!user || !user.walletType || (!user.demoWallet && !user.activeWallet)) {
            return res.status(200).json({
                success: false,
                message: "User or wallet info missing"
            });
        }

        const walletModel = user.walletType === "demo" ? DemoWalletModel : ActiveWalletModel;
        const walletId = user.walletType === "demo" ? user.demoWallet : user.activeWallet;
        const wallet = await walletModel.findById(walletId);

        if (!wallet) {
            return res.status(200).json({ success: false, message: "Wallet not found" });
        }

        // Update wallet values
        wallet.balance = parseFloat((wallet.balance + realisedPL).toFixed(2));
        wallet.equity = parseFloat((wallet.equity + realisedPL).toFixed(2));
        wallet.available = parseFloat((wallet.available + realisedPL + openOrder.margin).toFixed(2));
        wallet.margin = parseFloat((wallet.margin - openOrder.margin).toFixed(2));

        // Save all updates
        await Promise.all([
            closedOrder.save(),
            wallet.save(),
            UserModel.updateOne(
                { _id: openOrder.userId },
                {
                    $push: { closedOrders: closedOrder.orderId },
                    $pull: { openOrders: orderId }
                }
            )
        ]);

        return res.status(200).json({
            success: true,
            message: "Order closed successfully",
            data: {
                orderId,
                realisedPL: parseFloat(realisedPL.toFixed(2)),
                newBalance: wallet.balance
            }
        });

    } catch (error) {
        console.error("Order close error:", error);
        return res.status(200).json({
            success: false,
            message: "Processing error",
            error: error.message
        });
    }
});

export default router;
