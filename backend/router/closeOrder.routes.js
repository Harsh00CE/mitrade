import express from "express";
import OrderModel from "../schemas/orderSchema.js";
import OrderHistoryModel from "../schemas/orderHistorySchema.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { orderId, closingPrice } = req.body;

        // Input validation
        if (!orderId || !closingPrice) {
            return res.status(400).json({
                success: false,
                message: "Order ID and closing price are required",
            });
        }

        // Quick check if order exists and isn't already closed
        const existingOrder = await OrderModel.findById(orderId).lean();
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        if (existingOrder.status === "closed") {
            return res.status(400).json({
                success: false,
                message: "Order is already closed",
            });
        }

        // First respond to the client
        const resp = res.status(200).json({
            success: true,
            message: "Order closing request received. Processing in background.",
        });

        if (resp) {
            processOrderClosure(orderId, closingPrice);
            return;
        }

    } catch (error) {
        console.error("❌ Error in order closing request:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

async function processOrderClosure(orderId, closingPrice) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Re-check status in transaction to prevent race conditions
        const order = await OrderModel.findById(orderId).session(session);
        if (!order || order.status === "closed") {
            console.log(`Order ${orderId} already closed or not found during processing`);
            return;
        }

        // Calculate values
        const openingValue = order.price * order.quantity;
        const closingValue = closingPrice * order.quantity;
        const realisedPL = order.type === "buy" ? closingValue - openingValue : openingValue - closingValue;

        // Update order
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

        // Get user and wallet
        const user = await UserModel.findById(order.userId).populate("demoWallet").session(session).lean();
        if (!user) {
            console.error(`User not found for order ${orderId}`);
            return;
        }

        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id).session(session);
        if (!demoWallet) {
            console.error(`Demo wallet not found for user ${user._id}`);
            return;
        }

        // Create order history
        const orderHistory = new OrderHistoryModel({
            ...updatedOrder.toObject(),
            _id: undefined,
            status: "closed",
            position: "close",
            closingTime: new Date(),
            closingValue,
            openingValue,
        });

        // Update wallet
        demoWallet.balance += realisedPL;
        demoWallet.available += realisedPL + order.margin;
        demoWallet.equity += realisedPL;
        demoWallet.margin -= order.margin;

        // Execute all updates
        await Promise.all([
            orderHistory.save({ session }),
            demoWallet.save({ session }),
            UserModel.findByIdAndUpdate(user._id, { $push: { orderHistory: orderHistory._id } }).session(session),
        ]);

        await session.commitTransaction();
        console.log("✅ Order closed successfully:", orderId);

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Error processing order closure:", error);
    } finally {
        session.endSession();
    }
}

export default router;