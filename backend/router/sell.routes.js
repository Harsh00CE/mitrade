import express from "express";
import UserModel from "../schemas/userSchema.js";
import OrderModel from "../schemas/orderSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import { v4 as uuidv4 } from 'uuid';
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss, status } = req.body;

        if (!(userId && symbol && quantity && price && leverage && status)) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const user = await UserModel.findById(userId).select("demoWallet").lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const demoWallet = await DemoWalletModel.findById(user.demoWallet).session(session).select("available margin");
        if (!demoWallet) return res.status(404).json({ success: false, message: "Demo wallet not found" });

        const marginRequired = Math.round((quantity * price) / leverage * 100) / 100;
        if (demoWallet.available < marginRequired) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        demoWallet.available -= marginRequired;
        demoWallet.margin += marginRequired;

        const order = new OrderModel({
            orderId: uuidv4(),
            userId,
            symbol,
            type: "sell",
            quantity,
            price,
            leverage,
            takeProfit,
            stopLoss,
            margin: marginRequired,
            status,
            position: "open",
            openingTime: new Date(),
            tradingAccount: "demo",
        });

        await Promise.all([order.save({ session }), demoWallet.save({ session })]);

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ success: true, message: "Sell order placed successfully" });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error placing sell order:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;
