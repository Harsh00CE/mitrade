import express from "express";
import UserModel from "../schemas/userSchema.js";
import { v4 as uuidv4 } from 'uuid';
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";

const router = express.Router();

connectDB().catch(console.error);

router.post("/", async (req, res) => {
    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss, contractSize } = req.body;

        if (!userId || !symbol || !quantity || !price || !leverage) {
            return res.status(200).json({
                success: false,
                message: "Required fields: userId, symbol, quantity, price, leverage",
            });
        }

        if (isNaN(quantity) || isNaN(price) || isNaN(leverage) ||
            quantity <= 0 || price <= 0 || leverage < 1) {
            return res.status(200).json({
                success: false,
                message: "Quantity and price must be positive numbers, leverage must be ≥1",
            });
        }

        const user = await UserModel.findById(userId)
            .select('demoWallet')
            .populate('demoWallet');

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
        const getISTDate = () => {
            const now = new Date();
            const istOffset = 5.5 * 60;
            return new Date(now.getTime() + istOffset * 60 * 1000);
        };

        // 🧠 Process takeProfit
        let formattedTP = null;
        if (takeProfit && typeof takeProfit === 'object' && takeProfit.type && takeProfit.value !== undefined) {
            const allowedTypes = ['price', 'profit'];
            if (!allowedTypes.includes(takeProfit.type) || isNaN(takeProfit.value)) {
                return res.status(200).json({ success: false, message: "Invalid takeProfit format" });
            }
            formattedTP = {
                type: takeProfit.type,
                value: parseFloat(takeProfit.value)
            };
        }

        // 🧠 Process stopLoss
        let formattedSL = null;
        if (stopLoss && typeof stopLoss === 'object' && stopLoss.type && stopLoss.value !== undefined) {
            const allowedTypes = ['price', 'loss'];
            if (!allowedTypes.includes(stopLoss.type) || isNaN(stopLoss.value)) {
                return res.status(200).json({ success: false, message: "Invalid stopLoss format" });
            }
            formattedSL = {
                type: stopLoss.type,
                value: parseFloat(stopLoss.value)
            };
        }

        const order = new OpenOrdersModel({
            orderId,
            symbol,
            contractSize,
            type: "buy",
            quantity: parseFloat(quantity),
            openingPrice: parseFloat(price),
            leverage: parseInt(leverage),
            takeProfit: formattedTP,
            stopLoss: formattedSL,
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

        await Promise.all([order.save(), wallet.save()]);

        res.status(200).json({
            success: true,
            message: "Buy order placed successfully",
            data: {
                orderId,
                symbol,
                quantity,
                price,
                marginRequired,
                openingTime: order.openingTime
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
