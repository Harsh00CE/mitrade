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
            return res.status(400).json({
                success: false,
                message: "Required fields: userId, symbol, quantity, price, leverage",
            });
        }

        // Validate numeric fields
        if (quantity <= 0 || price <= 0 || leverage < 1) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Quantity and price must be positive, leverage must be ≥1"
            });
        }

        // Get user with only necessary fields
        const user = await UserModel.findById(userId)
            .select('demoWallet')
            .populate({
                path: 'demoWallet',
                select: 'available margin'
            })
            .session(session)
            .lean();

        if (!user || !user.demoWallet) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ 
                success: false, 
                message: "User or wallet not found" 
            });
        }

        // Calculate margin requirements
        const marginRequired = Number(((quantity * price) / leverage).toFixed(2));

        // Check available balance
        if (user.demoWallet.available < marginRequired) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient balance. Required: ${marginRequired}, Available: ${user.demoWallet.available}` 
            });
        }

        // Create order in OpenOrders collection
        const orderId = uuidv4();
        const openingValue = quantity * price;

        const order = new OpenOrdersModel({
            orderId,
            symbol,
            type: "sell", // Changed to sell
            quantity,
            price,
            leverage,
            takeProfit: takeProfit || null,
            stopLoss: stopLoss || null,
            trailingStop: "Unset",
            status: "active", // Default status for new orders
            position: "open",
            openingTime: new Date(),
            margin: marginRequired,
            openingValue,
            tradingAccount: "demo",
            userId
        });

        // Atomic wallet update operation
        const walletUpdate = {
            $inc: {
                available: -marginRequired,
                margin: marginRequired
            },
            $set: {
                lastUpdated: new Date()
            }
        };

        // Send response before committing transaction
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

        // Execute all operations in transaction
        await Promise.all([
            order.save({ session }),
            DemoWalletModel.findByIdAndUpdate(
                user.demoWallet._id,
                walletUpdate,
                { session, new: true }
            )
        ]);

        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Sell order error:", error.message);
        // Response already sent in happy path
    }
});

export default router;