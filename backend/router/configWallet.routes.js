import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();

router.post("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId , balance , equity , available , margin } = req.body;

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "User ID is required",
            });
        }
        if (!balance) {
            return res.status(200).json({
                success: false,
                message: "Balance is required",
            });
        }
        if (!equity) {
            return res.status(200).json({
                success: false,
                message: "Equity is required",
            });
        }
        if (!available) {
            return res.status(200).json({
                success: false,
                message: "Available is required",
            });
        }
        if (!margin) {
            return res.status(200).json({
                success: false,
                message: "Margin is required",
            });
        }

        const user = await UserModel.findById(userId);
        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        await user.save();

        demoWallet.balance = balance;
        demoWallet.available = available;
        demoWallet.equity = equity;
        demoWallet.margin = margin;

        await demoWallet.save();

        return res.status(200).json({
            success: true,
            message: "User liquidated successfully",
            data: {
                closedOrders: openOrders.length,
                updatedBalance: demoWallet.balance,
                updatedAvailable: demoWallet.available,
            },
        });
    } catch (error) {
        console.error("Error liquidating user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;