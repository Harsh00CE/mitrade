import express from "express";
import UserModel from "../schemas/userSchema.js";
import OrderModel from "../schemas/orderSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import { v4 as uuidv4 } from 'uuid';
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();

router.post("/sell", async (req, res) => {
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
        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const marginRequired = (quantity * price) / leverage;

        if (demoWallet.available < marginRequired) {
            return res.status(400).json({
                success: false,
                message: "Insufficient available balance",
            });
        }

        demoWallet.available -= marginRequired;
        
        const orderId = uuidv4();

        const order = new OrderModel({
            orderId,
            userId,
            symbol,
            type: "sell", 
            quantity,
            price,
            leverage,
            takeProfit,
            stopLoss,
            margin: marginRequired,
            status: status,
            position: "open",
            openingTime: new Date(),
            tradingAccount: "demo",
        });

        await order.save();
        await demoWallet.save();
        user.orderList.push(order._id);

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Sell order placed successfully",
            order,
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