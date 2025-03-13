import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import OrderModel from "../schemas/orderSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();
    try {
        const { orderId, closingPrice } = req.body;

        if (!orderId || !closingPrice) {
            return res.status(400).json({
                success: false,
                message: "Order ID and closing price are required",
            });
        }

        const order = await OrderModel.findById(orderId);
        const demoWallet = await DemoWalletModel.findById(order.userId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.status === "closed") {
            return res.status(400).json({
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

        const user = await UserModel.findById(order.userId).populate("demoWallet");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        demoWallet.balance = demoWallet.balance + realisedPL + order.margin;
        demoWallet.available = demoWallet.available + realisedPL;
        demoWallet.equity = demoWallet.equity + realisedPL;
        demoWallet.margin = order.margin;
        
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