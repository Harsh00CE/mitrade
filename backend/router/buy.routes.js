import express from "express";
import UserModel from "../schemas/userSchema.js";

import connectDB from "../ConnectDB/ConnectionDB.js";
import { v4 as uuidv4 } from 'uuid';
import OpenOrdersModel from "../schemas/openOrderSchema.js";

const router = express.Router();

// Pre-connect to DB when app starts (remove from route handler)
connectDB().catch(console.error);

router.post("/", async (req, res) => {
    const session = await OpenOrdersModel.startSession();
    session.startTransaction();

    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss } = req.body;

        // Input validation
        if (!userId || !symbol || !quantity || !price || !leverage) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Required fields: userId, symbol, quantity, price, leverage",
            });
        }

        // Get user with only necessary fields
        const user = await UserModel.findById(userId)
            .select('demoWallet')
            .populate('demoWallet', 'available margin')
            .session(session)
            .lean();

        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: "User not found",
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
                message: `Insufficient available balance. Required: ${marginRequired}, Available: ${user.demoWallet.available}`,
            });
        }

        // Create order ID
        const orderId = uuidv4();
        const openingValue = quantity * price;

        // Create order in OpenOrders collection
        const order = new OpenOrdersModel({
            orderId,
            symbol,
            type: "buy",
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


        // orderId,
        // userId,
        // symbol,
        // type: "buy",
        // quantity,
        // price,
        // leverage,
        // takeProfit,
        // stopLoss,
        // margin: marginRequired,
        // status,
        // position: "open",
        // openingTime: new Date(),
        // tradingAccount: "demo",

        // Update wallet balances atomically
        const walletUpdate = {
            $inc: {
                available: -marginRequired,
                margin: marginRequired
            }
        };

        // Send response before committing transaction
        res.status(200).json({
            success: true,
            message: "Buy order placed successfully",
            orderId
        });

        // Execute all operations in transaction
        await Promise.all([
            order.save({ session }),
            OpenOrdersModel.updateOne(
                { _id: user.demoWallet._id },
                walletUpdate,
                { session }
            )
        ]);

        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Order placement error:", error.message);
        // Response already sent, can't send another
    }
});

export default router;