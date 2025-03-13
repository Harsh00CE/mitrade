import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import OrderModel from "../schemas/orderSchema.js";
import OrderHistoryModel from "../schemas/orderHistorySchema.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();
    try {
        const { orderId, closingPrice } = req.body;
        if (!orderId || !closingPrice) {
            return res.status(200).json({
                success: false,
                message: "Order ID and closing price are required",
            });
        }

        const order = await OrderModel.findById(orderId);


        if (!order) {
            return res.status(200).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.status === "closed") {
            return res.status(200).json({
                success: false,
                message: "Order is already closed",
            });
        }

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

        const user = await UserModel.findById(order.userId).populate("demoWallet");
        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        if (!demoWallet) {
            return res.status(200).json({
                success: false,
                message: "Demo wallet not found",
            });
        }

        user.orderHistory.push(orderHistory._id);
        await user.save();

        // demoWallet.balance += realisedPL; 
        // demoWallet.available = demoWallet.balance - demoWallet.margin;
        // demoWallet.equity = demoWallet.balance; 
        // demoWallet.margin -= order.margin;

        demoWallet.balance = demoWallet.balance + realisedPL;
        demoWallet.available = demoWallet.available + realisedPL + order.margin;
        demoWallet.equity = demoWallet.equity + realisedPL;
        demoWallet.margin = demoWallet.margin - order.margin;

    

        await demoWallet.save();

        return res.status(200).json({
            success: true,
            message: "Order closed successfully",
            data: {
                order,
                updatedBalance: demoWallet.balance,
                updatedAvailable: demoWallet.available,
            },
        });
    } catch (error) {
        console.error("Error closing order:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;