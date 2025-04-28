import express from "express";
import ClosedOrdersModel from "../schemas/closeOrderSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import mongoose from "mongoose";
import UserModel from "../schemas/userSchema.js";

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


router.get("/filter/:userId", async (req, res) => {

    try {
        const { range } = req.body;
        const { userId } = req.params;


        console.log("range", range);
        console.log("userId", userId);


        if (!range || !userId) {
            return res.status(400).json({
                success: false,
                message: "Range and userId are required. Example: ?range=today&userId=123"
            });
        }


        let startDate;
        const now = new Date();

        switch (range) {
            case 'Today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'Weekly':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'Monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid range. Use 'Today', 'Weekly', or 'Monthly'."
                });
        }

        const user = await UserModel.findById(userId);

        const walletType = user.walletType;
        if (!walletType) {
            return res.status(200).json({
                success: false,
                message: "User wallet type not found",
            })
        }

        const orders = await ClosedOrdersModel.find({
            userId,
            tradingAccount: walletType,
            closingTime: { $gte: startDate }
        }).sort({ closingTime: -1 }).lean();

        return res.status(200).json({
            success: true,
            message: orders.length ? "Closed orders fetched successfully" : "No closed orders found",
            data: orders
        });

    } catch (error) {
        console.error("Error fetching filtered closed orders:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching filtered closed orders"
        });
    }
});


router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Fast validation
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(200).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        const user = await UserModel.findById(userId)
        console.log("user", user);

        if (!user || !user.demoWallet) {
            return res.status(200).json({
                success: false,
                message: "User or wallet not found"
            });
        }



        if (!user.walletType) {
            return res.status(200).json({
                success: false,
                message: "User wallet type not found",
            })
        }

        if (!user.demoWallet && !user.activeWallet) {
            return res.status(200).json({
                success: false,
                message: "User wallet not found",
            })
        }

        const walletType = user.walletType;



        const orders = await ClosedOrdersModel.find(
            { userId, tradingAccount: walletType },
        )


        return res.status(200).json({
            success: true,
            message: orders.length ? "Closed orders fetched successfully" : "No closed orders found",
            data: orders
        });

    } catch (error) {
        console.error("Error fetching closed orders:", error);
        return res.status(200).json({
            success: false,
            message: "Error fetching closed orders"
        });
    }
});

// router.get("/", async (req, res) => {
//     try {

//         const orders = await ClosedOrdersModel.find()
//             .lean()
//         return res.status(200).json({
//             success: true,
//             message: orders.length ? "Closed orders fetched successfully" : "No closed orders found",
//             data: orders
//         });

//     } catch (error) {
//         console.error("Error fetching closed orders:", error);
//         return res.status(200).json({
//             success: false,
//             message: "Error fetching closed orders"
//         });
//     }
// });



export default router;