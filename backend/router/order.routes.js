import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import mongoose from "mongoose";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

// Connect to DB once when app starts
connectDB().catch(console.error);

// Projection for optimized data transfer
// const ORDER_PROJECTION = {
//     orderId: 1,
//     symbol: 1,
//     type: 1,
//     quantity: 1,
//     price: 1,
//     leverage: 1,
//     status: 1,
//     openingTime: 1,
//     takeProfit: 1,
//     stopLoss: 1,
//     margin: 1,
//     openingValue: 1
// };

// router.get("/:userId", async (req, res) => {
//     try {
//         const { userId } = req.params;

//         // Fast validation
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Invalid user ID format"
//             });
//         }

//         // Fetch only active/open orders with optimized projection
//         const orders = await OpenOrdersModel.find(
//             { 
//                 userId,
//                 status: "active",
//                 position: "open"
//             },
//             // ORDER_PROJECTION
//         )
//         .lean() // Faster response
//         .sort({ openingTime: -1 });

//         const user = await UserModel.findById(userId);

//         const accountType = user.walletType;

//         if (!user) {
//             return res.status(200).json({
//                 success: false,
//                 message: "User not found",
//                 data: []
//             });
//         }

//         if (!accountType) {
//             return res.status(200).json({
//                 success: false,
//                 message: "User wallet type not found",
//                 data: []
//             });
//         }



//         if (!orders.length) {
//             return res.status(200).json({
//                 success: true,
//                 message: "No open orders found",
//                 data: []
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Open orders fetched successfully",
//             data: orders
//         });

//     } catch (error) {
//         console.error("Error fetching open orders:", error);
//         return res.status(200).json({
//             success: false,
//             message: "Error fetching orders"
//         });
//     }
// });



router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(200).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        // Fetch user account type
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
                data: []
            });
        }

        const accountType = user.walletType;
        if (!accountType) {
            return res.status(200).json({
                success: false,
                message: "User wallet type not found",
                data: []
            });
        }

        // Fetch orders that match user's accountType
        const orders = await OpenOrdersModel.find(
            {
                status: "active",
                position: "open",
                tradingAccount: accountType,
                userId: userId
            }
        )
            .lean()
            .sort({ openingTime: -1 });

        if (!orders.length) {
            return res.status(200).json({
                success: true,
                message: "No open orders found",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Open orders fetched successfully",
            data: orders
        });

    } catch (error) {
        console.error("Error fetching open orders:", error);
        return res.status(200).json({
            success: false,
            message: "Error fetching orders"
        });
    }
});

router.get("/panding/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(200).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        // Fetch user account type
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
                data: []
            });
        }

        const accountType = user.walletType;
        if (!accountType) {
            return res.status(200).json({
                success: false,
                message: "User wallet type not found",
                data: []
            });
        }

        // Fetch orders that match user's accountType
        const orders = await OpenOrdersModel.find(
            {
                userId: userId,
                status: "pending",
                position: "open",
                tradingAccount: accountType
            }
        )
            .lean()
            .sort({ openingTime: -1 });

        if (!orders.length) {
            return res.status(200).json({
                success: true,
                message: "No open orders found",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Open orders fetched successfully",
            data: orders
        });

    } catch (error) {
        console.error("Error fetching open orders:", error);
        return res.status(200).json({
            success: false,
            message: "Error fetching orders"
        });
    }
});

router.delete("/cancel-pending/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(200).json({
                success: false,
                message: "Invalid order ID format",
            });
        }

        // Find the order
        const order = await OpenOrdersModel.findById(orderId);

        if (!order) {
            return res.status(200).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.status !== "pending" || order.position !== "open") {
            return res.status(200).json({
                success: false,
                message: "Only pending open orders can be canceled",
            });
        }

        // Delete the order
        await OpenOrdersModel.findByIdAndDelete(orderId);

        // Optionally update the user's openOrders list
        await UserModel.updateOne(
            { _id: order.userId },
            { $pull: { openOrders: orderId } }
        );

        return res.status(200).json({
            success: true,
            message: "Pending order cancelled successfully",
            data: order
        });

    } catch (error) {
        console.error("Error cancelling pending order:", error);
        return res.status(200).json({
            success: false,
            message: "Error cancelling order"
        });
    }
});




export default router;