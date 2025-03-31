import express from "express";
import mongoose from "mongoose";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import { v4 as uuidv4 } from 'uuid';
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";

const router = express.Router();

// Pre-connect to DB when app starts
connectDB().catch(console.error);

router.post("/", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss } = req.body;

        // Input validation
        if (!userId || !symbol || !quantity || !price || !leverage) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Required fields: userId, symbol, quantity, price, leverage",
            });
        }

        // Numeric validation
        if (isNaN(quantity) || isNaN(price) || isNaN(leverage) || 
            quantity <= 0 || price <= 0 || leverage < 1) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Quantity and price must be positive numbers, leverage must be ≥1",
            });
        }

        // Get user with wallet
        const user = await UserModel.findById(userId)
            .select('demoWallet')
            .populate('demoWallet')
            .session(session);

        if (!user || !user.demoWallet) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "User or wallet not found",
            });
        }

        const wallet = user.demoWallet;

        // Calculate margin requirements
        const marginRequired = parseFloat(((quantity * price) / leverage).toFixed(2));
        
        // Check available balance
        if (wallet.available < marginRequired) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Insufficient available balance. Required: ${marginRequired}, Available: ${wallet.available}`,
            });
        }

        // Create order
        const orderId = uuidv4();
        const openingValue = quantity * price;

        const order = new OpenOrdersModel({
            orderId,
            symbol,
            type: "buy",
            quantity: parseFloat(quantity),
            price: parseFloat(price),
            leverage: parseInt(leverage),
            takeProfit: takeProfit ? parseFloat(takeProfit) : null,
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
            trailingStop: "Unset",
            status: "active",
            position: "open",
            openingTime: new Date(),
            margin: marginRequired,
            openingValue,
            tradingAccount: "demo",
            userId
        });

        // Update wallet
        wallet.available = parseFloat((wallet.available - marginRequired).toFixed(2));
        wallet.margin = parseFloat((wallet.margin + marginRequired).toFixed(2));

        // Execute operations
        await Promise.all([
            order.save({ session }),
            wallet.save({ session })
        ]);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Buy order placed successfully",
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
        console.error("Order placement error:", error.message);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to place buy order",
                error: error.message
            });
        }
    } finally {
        session.endSession();
    }
});

export default router;