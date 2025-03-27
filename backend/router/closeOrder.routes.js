import express from "express";
import OrderModel from "../schemas/orderSchema.js";
import OrderHistoryModel from "../schemas/orderHistorySchema.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId, closingPrice } = req.body;
        if (!orderId || !closingPrice) {
            return res.status(400).json({
                success: false,
                message: "Order ID and closing price are required",
            });
        }

        // Fetch order and user details
        const order = await OrderModel.findById(orderId).session(session).lean();
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.status === "closed") return res.status(400).json({ success: false, message: "Order is already closed" });

        // Calculate profit/loss
        const openingValue = order.price * order.quantity;
        const closingValue = closingPrice * order.quantity;
        const realisedPL = order.type === "buy" ? closingValue - openingValue : openingValue - closingValue;

        // Update order details
        const updatedOrder = await OrderModel.findByIdAndUpdate(
            orderId,
            {
                status: "closed",
                position: "close",
                closingTime: new Date(),
                closingValue,
                realisedPL,
            },
            { new: true, session }
        );

        // Fetch user and demo wallet
        const user = await UserModel.findById(order.userId).populate("demoWallet").session(session).lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id).session(session);
        if (!demoWallet) return res.status(404).json({ success: false, message: "Demo wallet not found" });

        // Move order to history with correct values
        const orderHistory = new OrderHistoryModel({
            ...updatedOrder.toObject(),
            _id: undefined, // Prevent duplicate _id
            status: "closed", // ✅ Fix status
            position: "close", // ✅ Fix position
            closingTime: new Date(), // ✅ Ensure closingTime is set
            closingValue, // ✅ Ensure closingValue is set
            openingValue,
        });

        // Update wallet balances
        demoWallet.balance += realisedPL;
        demoWallet.available += realisedPL + order.margin;
        demoWallet.equity += realisedPL;
        demoWallet.margin -= order.margin;

        // Perform DB writes
        await Promise.all([
            orderHistory.save({ session }),
            demoWallet.save({ session }),
            UserModel.findByIdAndUpdate(user._id, { $push: { orderHistory: orderHistory._id } }).session(session),
        ]);

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Order closed successfully",
            data: {
                order: updatedOrder,
                updatedBalance: demoWallet.balance,
                updatedAvailable: demoWallet.available,
            },
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("❌ Error closing order:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});


export default router;
