import express from "express";
import mongoose from "mongoose";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import { v4 as uuidv4 } from 'uuid';
import OpenOrdersModel from "../schemas/openOrderSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss } = req.body;
        
        // Validate required fields
        if (!userId || !symbol || !quantity || !price || !leverage) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({
                success: false,
                message: "Required fields: userId, symbol, quantity, price, leverage",
            });
        }

        // Validate numeric fields
        if (isNaN(quantity) || isNaN(price) || isNaN(leverage) || 
            quantity <= 0 || price <= 0 || leverage < 1) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({
                success: false,
                message: "Quantity and price must be positive numbers, leverage must be ≥1"
            });
        }

        // Get user with wallet
        const user = await UserModel.findById(userId)
            .select('demoWallet')
            .populate('demoWallet')
            .session(session);

        if (!user || !user.demoWallet) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ 
                success: false, 
                message: "User or wallet not found" 
            });
        }

        const wallet = user.demoWallet;

        // Calculate margin requirements
        const marginRequired = parseFloat(((quantity * price) / leverage).toFixed(2));

        // Check available balance
        if (wallet.available < marginRequired) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ 
                success: false, 
                message: `Insufficient balance. Required: ${marginRequired}, Available: ${wallet.available}` 
            });
        }

        // Create order
        const orderId = uuidv4();
        const openingValue = quantity * price;

        const order = new OpenOrdersModel({
            orderId,
            symbol,
            type: "sell",
            quantity: parseFloat(quantity),
            openingPrice: parseFloat(price),
            leverage: parseInt(leverage),
            takeProfit: takeProfit ? parseFloat(takeProfit) : null,
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
            trailingStop: "Unset",
            status: "active",
            position: "open",
            openingTime: new Date(),
            margin: marginRequired,
            tradingAccount: "demo",
            userId
        });

        // Update wallet
        wallet.available = parseFloat((wallet.available - marginRequired).toFixed(2));
        wallet.margin = parseFloat((wallet.margin + marginRequired).toFixed(2));

        // Execute operations
        await order.save({ session });
        await wallet.save({ session });

        await session.commitTransaction();
        
        res.status(200).json({
            success: true,
            message: "Sell order placed successfully",
            data: {
                orderId,
                symbol,
                quantity,
                price,
                marginRequired
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Sell order error:", error.message);
        
        // Only send response if not already sent
        if (!res.headersSent) {
            res.status(200).json({
                success: false,
                message: "Failed to place sell order",
                error: error.message
            });
        }
    } finally {
        session.endSession();
    }
});

export default router;