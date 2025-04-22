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

        // Input Validation
        if (!mongoose.Types.ObjectId.isValid(orderId) || typeof closingPrice !== 'number') {
            return res.status(200).json({ success: false, message: "Invalid input" });
        }

        // Find and remove open order
        const openOrder = await OpenOrdersModel.findOneAndDelete({
            _id: orderId,
            status: "active"
        })


        if (!openOrder) {
            const isClosed = await ClosedOrdersModel.exists({ originalOrderId: orderId }).lean();
            return res.status(isClosed ? 200 : 404).json({
                success: false,
                message: isClosed ? "Order already closed" : "Active order not found"
            });
        }


        // Calculate values
        const openingValue = openOrder.openingPrice * openOrder.quantity;
        const closingValue = closingPrice * openOrder.quantity;
        let realisedPL = openOrder.type === "buy"
            ? closingValue - openingValue
            : openingValue - closingValue;

        realisedPL = parseFloat((realisedPL * openOrder.contractSize).toFixed(2));
        
        console.log("stoploss", openOrder.stopLoss);
        console.log("takeprofit", openOrder.takeProfit);
        

        const closedOrder = new ClosedOrdersModel({
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
            takeProfit: openOrder.takeProfit,
            stopLoss: openOrder.stopLoss,
            realisedPL,
            margin: openOrder.margin,
            tradingAccount: openOrder.tradingAccount || "demo",
            closeReason: "manual"
        });

        // Get user and wallet
        const user = await UserModel.findById(openOrder.userId)

        if (!user || !user.demoWallet) {
            return res.status(200).json({
                success: false,
                message: "User or wallet not found"
            });
        }

        if (!user.walletType) {
            return res.status(200).json({
                success: false,
                message: "User wallet type not found",
            })
        }

        if (!user.demoWallet && !user.activeWallet) {
            return res.status(200).json({
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


        if (!wallet) {
            return res.status(200).json({ success: false, message: "Wallet not found" });
        }

        wallet.balance = parseFloat((wallet.balance + realisedPL).toFixed(2));
        wallet.equity = parseFloat((wallet.equity + realisedPL).toFixed(2));
        wallet.available = parseFloat((wallet.available + realisedPL + openOrder.margin).toFixed(2));
        wallet.margin = parseFloat((wallet.margin - openOrder.margin).toFixed(2));

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