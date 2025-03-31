import express from "express";
import ClosedOrdersModel from "../schemas/closeOrderSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import mongoose from "mongoose";

const router = express.Router();

// Connect to DB once when app starts
connectDB().catch(console.error);

// Projection for optimized data transfer
// const ORDER_PROJECTION = {
//     orderId: 1,
//     originalOrderId: 1,
//     symbol: 1,
//     type: 1,
//     quantity: 1,
//     openingPrice: 1,
//     closingPrice: 1,
//     leverage: 1,
//     openingTime: 1,
//     closingTime: 1,
//     realisedPL: 1,
//     margin: 1,
//     openingValue: 1,
//     closingValue: 1,
//     closeReason: 1
// };

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Fast validation
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        // Fetch closed orders with optimized projection
        const orders = await ClosedOrdersModel.find(
            { userId },
            // ORDER_PROJECTION
        )
        .lean()
        return res.status(200).json({
            success: true,
            message: orders.length ? "Closed orders fetched successfully" : "No closed orders found",
            data: orders
        });

    } catch (error) {
        console.error("Error fetching closed orders:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching closed orders"
        });
    }
});

export default router;