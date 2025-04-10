import express from "express";
import UserModel from "../schemas/userSchema.js";
import { v4 as uuidv4 } from 'uuid';
import OpenOrdersModel from "../schemas/openOrderSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss , contractSize } = req.body;
        
        if (!userId || !symbol || !quantity || !price || !leverage) {
            return res.status(200).json({
                success: false,
                message: "Required fields: userId, symbol, quantity, price, leverage",
            });
        }

        // Validate numeric fields
        if (isNaN(quantity) || isNaN(price) || isNaN(leverage) || 
            quantity <= 0 || price <= 0 || leverage < 1) {
            return res.status(200).json({
                success: false,
                message: "Quantity and price must be positive numbers, leverage must be ≥1"
            });
        }
          const user = await UserModel.findById(userId)
            .select('demoWallet')
            .populate('demoWallet')

        if (!user || !user.demoWallet) {
            return res.status(200).json({ 
                success: false, 
                message: "User or wallet not found" 
            });
        }

        const wallet = user.demoWallet;
        const marginRequired = parseFloat(((quantity * price) / leverage).toFixed(2));

        if (wallet.available < marginRequired) {
            return res.status(200).json({ 
                success: false, 
                message: `Insufficient balance. Required: ${marginRequired}, Available: ${wallet.available}` 
            });
        }
        const orderId = uuidv4();
        const getISTDate = () => {
            const now = new Date();
            const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
            const istTime = new Date(now.getTime() + istOffset * 60 * 1000);
            return istTime;
        };


        const order = new OpenOrdersModel({
            orderId,
            symbol,
            contractSize,
            type: "sell",
            quantity: parseFloat(quantity),
            openingPrice: parseFloat(price),
            leverage: parseInt(leverage),
            takeProfit: takeProfit ? parseFloat(takeProfit) : null,
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
            trailingStop: "Unset",
            status: "active",
            position: "open",
            openingTime: getISTDate(),
            margin: marginRequired,
            tradingAccount: "demo",
            userId
        });

        wallet.available = parseFloat((wallet.available - marginRequired).toFixed(2));
        wallet.margin = parseFloat((wallet.margin + marginRequired).toFixed(2));

        await order.save();
        await wallet.save();

         res.status(200).json({
            success: true,
            message: "Sell order placed successfully",
            data: {
                orderId,
                symbol,
                quantity,
                price,
                marginRequired,
                openingTime: getISTDate(),
            }
        });

    } catch (error) {
        console.error("Sell order error:", error.message);
        
        // Only send response if not already sent
        if (!res.headersSent) {
            res.status(200).json({
                success: false,
                message: "Failed to place sell order",
                error: error.message
            });
        }
    }
});

export default router;