import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import OrderModel from "../schemas/orderSchema.js";

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

        const orders = await OrderModel.find({ userId , position: "open"});

        if (!orders || orders.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No orders found for this user",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: orders,
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return res.status(200).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;