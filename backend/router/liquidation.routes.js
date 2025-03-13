import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import OrderModel from "../schemas/orderSchema.js";
import OrderHistoryModel from "../schemas/orderHistorySchema.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

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

        const user = await UserModel.findById(userId).populate("demoWallet");
        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const openOrders = await OrderModel.find({ userId, status: "open" });

        if (!openOrders || openOrders.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No open orders found for this user",
            });
        }

        for (const order of openOrders) {
            const openingValue = order.price * order.quantity;
            const closingValue = order.closingValue; 
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

        demoWallet.balance = 0;
        demoWallet.available = 0;
        demoWallet.equity = 0;
        demoWallet.margin = 0;

        await demoWallet.save();

        return res.status(200).json({
            success: true,
            message: "User liquidated successfully",
            data: {
                closedOrders: openOrders.length,
                updatedBalance: demoWallet.balance,
                updatedAvailable: demoWallet.available,
            },
        });
    } catch (error) {
        console.error("Error liquidating user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;