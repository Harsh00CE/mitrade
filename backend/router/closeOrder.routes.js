import express from "express";
import mongoose from "mongoose";
import OrderModel from "../schemas/orderSchema.js";
import OrderHistoryModel from "../schemas/orderHistorySchema.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId, closingPrice } = req.body;

        if (!orderId || !closingPrice) {
            return res.status(400).json({ success: false, message: "Order ID and closing price are required" });
        }

        // Fetch order, user, and wallet in parallel to reduce response time
        const [order, user] = await Promise.all([
            OrderModel.findById(orderId).lean(),
            UserModel.findOne({ "orders": orderId }).select("demoWallet orderHistory").lean()
        ]);

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.status === "closed") return res.status(400).json({ success: false, message: "Order is already closed" });

        const demoWallet = await DemoWalletModel.findById(user?.demoWallet).session(session);
        if (!demoWallet) return res.status(404).json({ success: false, message: "Demo wallet not found" });

        // Calculate profit/loss
        const openingValue = order.price * order.quantity;
        const closingValue = closingPrice * order.quantity;
        const realisedPL = order.type === "buy" ? closingValue - openingValue : openingValue - closingValue;

        const bulkOps = [
            {
                updateOne: {
                    filter: { _id: orderId },
                    update: {
                        $set: {
                            status: "closed",
                            position: "close",
                            closingTime: new Date(),
                            closingValue,
                            realisedPL
                        }
                    }
                }
            },
            {
                insertOne: {
                    document: {
                        ...order,
                        _id: new mongoose.Types.ObjectId(),
                        openingValue,
                        closingTime: new Date(),
                        realisedPL
                    }
                }
            },
            {
                updateOne: {
                    filter: { _id: demoWallet._id },
                    update: {
                        $inc: {
                            balance: realisedPL,
                            available: realisedPL + order.margin,
                            equity: realisedPL,
                            margin: -order.margin
                        }
                    }
                }
            },
            {
                updateOne: {
                    filter: { _id: user._id },
                    update: { $push: { orderHistory: orderId } }
                }
            }
        ];

        await Promise.all([
            OrderModel.bulkWrite([bulkOps[0]], { session }),
            OrderHistoryModel.bulkWrite([bulkOps[1]], { session }),
            DemoWalletModel.bulkWrite([bulkOps[2]], { session }),
            UserModel.bulkWrite([bulkOps[3]], { session })
        ]);

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Order closed successfully",
            data: {
                updatedBalance: demoWallet.balance + realisedPL,
                updatedAvailable: demoWallet.available + realisedPL + order.margin,
            },
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error closing order:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;
