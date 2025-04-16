import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import OrderModel from "../schemas/orderSchema.js";
import OrderHistoryModel from "../schemas/orderHistorySchema.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";

const router = express.Router();

router.post("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await UserModel.findById(userId);

        if (!user || !user.demoWallet) {
            return res.status(200).json({
                success: false,
                message: "User or wallet not found"
            });
        }

        if (!user.walletType) {
            return res.status(200).json({
                success: false,
                message: "User wallet type not found",
            })
        }

        if (!user.demoWallet && !user.activeWallet) {
            return res.status(200).json({
                success: false,
                message: "User wallet not found",
            })
        }

        const walletType = user.walletType;
        let wallet;

        if (walletType === "demo") {
            wallet = await DemoWalletModel.findById(user.demoWallet);
        } else {
            wallet = await ActiveWalletModel.findById(user.activeWallet);
        }




        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const openOrders = await OrderModel.find({ userId, position: "open" });

        if (!openOrders || openOrders.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No open orders found for this user",
            });
        }
        const fetchClosingPrice = async (symbol) => {
            try {
                const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`);
                const data = await response.json();
                return parseFloat(data.price);
            } catch (error) {
                console.error("Error fetching closing price:", error);
                return null;
            }
        };


        for (const order of openOrders) {
            const closingPrice = await fetchClosingPrice(order.symbol);
            const openingValue = order.price * order.quantity;
            const closingValue = closingPrice * order.quantity;
            const realisedPL = order.type === "buy" ? closingValue - openingValue : openingValue - closingValue;

            order.status = "closed";
            order.position = "close";
            order.closingTime = new Date();
            order.closingValue = closingValue;
            order.realisedPL = realisedPL;

            await order.save();

            const orderHistory = new OrderHistoryModel({
                ...order.toObject(),
                _id: undefined,
                openingValue: openingValue,
            });

            await orderHistory.save();

            user.orderHistory.push(orderHistory._id);
        }

        await user.save();

        wallet.balance = 0;
        wallet.available = 0;
        wallet.equity = 0;
        wallet.margin = 0;

        await wallet.save();

        return res.status(200).json({
            success: true,
            message: "User liquidated successfully",
            data: {
                closedOrders: openOrders.length,
                updatedBalance: wallet.balance,
                updatedAvailable: wallet.available,
            },
        });
    } catch (error) {
        console.error("Error liquidating user:", error);
        return res.status(200).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;