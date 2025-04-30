import express from "express";
import UserModel from "../schemas/userSchema.js";
import { v4 as uuidv4 } from 'uuid';
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";
import PairInfoModel from "../schemas/pairInfo.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const orders = Array.isArray(req.body) ? req.body : [req.body];

        const responses = [];

        for (const orderData of orders) {
            const {
                userId, symbol, quantity, price,
                status, availableBalance
            } = orderData;

            if (!userId || !symbol || !quantity || !price || !status || !availableBalance) {
                responses.push({
                    success: false,
                    message: "Missing required fields",
                    data: orderData
                });
                continue; 
            }

            const symbolInfo = await PairInfoModel.findOne({ symbol });
            
            if (!symbolInfo) {
                responses.push({
                    success: false,
                    message: `Invalid symbol: ${symbol}`,
                    data: orderData
                });
                continue;
            }

            const { contractSize, leverage } = symbolInfo;

            if (isNaN(quantity) || isNaN(price) || quantity <= 0 || price <= 0 || leverage < 1) {
                responses.push({
                    success: false,
                    message: `Invalid quantity/price/leverage in symbol ${symbol}`,
                    data: orderData
                });
                continue;
            }

            const user = await UserModel.findById(userId);
            if (!user || !user.walletType) {
                responses.push({
                    success: false,
                    message: `User not found or wallet type missing for userId: ${userId}`,
                    data: orderData
                });
                continue;
            }

            let wallet;
            if (user.walletType === "demo") {
                wallet = await DemoWalletModel.findById(user.demoWallet);
            } else {
                wallet = await ActiveWalletModel.findById(user.activeWallet);
            }

            if (!wallet) {
                responses.push({
                    success: false,
                    message: `${user.walletType} wallet not found for user ${userId}`,
                    data: orderData
                });
                continue;
            }

            const marginRequired = parseFloat(((quantity * price * contractSize) / leverage).toFixed(2));

            if (availableBalance < marginRequired) {
                responses.push({
                    success: false,
                    message: `Insufficient balance: Required ${marginRequired}, Available ${availableBalance}`,
                    data: orderData
                });
                continue;
            }

            const orderId = uuidv4();
            const getISTDate = () => {
                const now = new Date();
                const istOffset = 5.5 * 60;
                return new Date(now.getTime() + istOffset * 60 * 1000);
            };

            const order = new OpenOrdersModel({
                orderId,
                symbol,
                contractSize,
                type: status,
                quantity: parseFloat(quantity),
                openingPrice: parseFloat(price),
                leverage: parseInt(leverage),
                trailingStop: "Unset",
                status: "active",
                position: "open",
                openingTime: getISTDate(),
                margin: marginRequired,
                tradingAccount: user.walletType,
                userId,
            });

            if (wallet.available > marginRequired) {
                wallet.available = parseFloat((wallet.available - marginRequired).toFixed(2));
                wallet.margin = parseFloat((wallet.margin + marginRequired).toFixed(2));
            }


            user.orderList.push(order._id);

            await Promise.all([order.save(), wallet.save(), user.save()]);

            responses.push({
                success: true,
                message: `Buy order placed for ${symbol}`,
                data: {
                    orderId,
                    symbol,
                    quantity,
                    price,
                    marginRequired,
                    openingTime: order.openingTime,
                    status: order.status,
                }
            });
        }

        return res.status(200).json({
            success: true,
            summary: responses
        });

    } catch (error) {
        console.error("Order placement error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to process orders",
            error: error.message
        });
    }
});



export default router;
