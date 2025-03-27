import express from "express";
import UserModel from "../schemas/userSchema.js";
import OrderModel from "../schemas/orderSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js"; // Import DemoWallet schema
import connectDB from "../ConnectDB/ConnectionDB.js";
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();

    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss, status } = req.body;

        if (!userId || !symbol || !quantity || !price || !leverage || !status) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: userId, symbol, quantity, price, leverage, takeProfit, stopLoss, status",
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch demoWallet separately
        const demoWallet = await DemoWalletModel.findById(user.demoWallet);
        if (!demoWallet) {
            return res.status(404).json({ success: false, message: "Demo wallet not found" });
        }

        // Calculate margin required
        const marginRequired = Number(((quantity * price) / leverage).toFixed(2));

        if (demoWallet.available < marginRequired) {
            return res.status(400).json({ success: false, message: "Insufficient available balance" });
        }

        // Update demo wallet balance
        demoWallet.available -= marginRequired;
        demoWallet.margin += marginRequired;

        // Create order
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

        // Save all in parallel
        await Promise.all([order.save(), demoWallet.save(), user.save()]);

        return res.status(200).json({
            success: true,
            message: "Sell order placed successfully",
        });

    } catch (error) {
        console.error("Error placing sell order:", error);
        return res.status(500).json({
            success: false,
            message: "Error placing sell order",
        });
    }
});

export default router;
