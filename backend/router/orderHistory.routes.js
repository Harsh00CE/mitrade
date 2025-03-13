import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import OrderHistoryModel from "../schemas/orderHistorySchema.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "User ID is required",
            });
        }

        const orders = await OrderHistoryModel.find({ userId });

        if (!orders || orders.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No closed orders found for this user",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Closed orders fetched successfully",
            data: orders,
        });
    } catch (error) {
        console.error("Error fetching closed orders:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;