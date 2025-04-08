import express from "express";
import UserModel from "../schemas/userSchema.js";
import { v4 as uuidv4 } from 'uuid';
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";


const router = express.Router();

connectDB().catch(console.error);

router.post("/", async (req, res) => {

   
    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss } = req.body;

        if (!userId || !symbol || !quantity || !price || !leverage) {
            return res.status(200).json({
                success: false,
                message: "Required fields: userId, symbol, quantity, price, leverage",
            });
        }

        // Numeric validation
        if (isNaN(quantity) || isNaN(price) || isNaN(leverage) || 
            quantity <= 0 || price <= 0 || leverage < 1) {
            return res.status(200).json({
                success: false,
                message: "Quantity and price must be positive numbers, leverage must be ≥1",
            });
        }

        // Get user with wallet
        const user = await UserModel.findById(userId)
            .select('demoWallet')
            .populate('demoWallet')

        if (!user || !user.demoWallet) {
            return res.status(200).json({
                success: false,
                message: "User or wallet not found",
            });
        }

        const wallet = user.demoWallet;

        const marginRequired = parseFloat(((quantity * price) / leverage).toFixed(2));
        
        if (wallet.available < marginRequired) {
            return res.status(200).json({
                success: false,
                message: `Insufficient available balance. Required: ${marginRequired}, Available: ${wallet.available}`,
            });
        }

        const orderId = uuidv4();

        const order = new OpenOrdersModel({
            orderId,
            symbol,
            type: "buy",
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

        wallet.available = parseFloat((wallet.available - marginRequired).toFixed(2));
        wallet.margin = parseFloat((wallet.margin + marginRequired).toFixed(2));

        await Promise.all([
            order.save(),
            wallet.save()
        ]);


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
        console.error("Order placement error:", error.message);
        
        if (!res.headersSent) {
            res.status(200).json({
                success: false,
                message: "Failed to place buy order",
                error: error.message
            });
        }
    } 
});

export default router;