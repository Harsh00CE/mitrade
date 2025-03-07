import express from "express";
import { UserModel, OrderModel } from "../schemas/userSchema.js"; 
import connectDB from "../ConnectDB/ConnectionDB.js";

const router = express.Router();

router.post("/sell", async (req, res) => {
    await connectDB();
    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss } = req.body;

        if (!userId || !symbol || !quantity || !price || !leverage || !takeProfit || !stopLoss) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: userId, symbol, quantity, price, leverage, takeProfit, stopLoss",
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const marginRequired = (quantity * price) / leverage;
        if (user.demoWallet.available < marginRequired) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance",
            });
        }

        user.demoWallet.available -= marginRequired;
        await user.save();

        const order = new OrderModel({
            userId,
            symbol,
            type: "sell",
            quantity,
            price,
            leverage,
            takeProfit,
            stopLoss,
            margin: marginRequired,
            status: "pending",
            position: "open",
            openingTime: new Date(),
        });

        await order.save();

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