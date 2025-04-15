import express from "express";
import UserModel from "../schemas/userSchema.js";
import mongoose from "mongoose";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();


const WALLET_PROJECTION = {
    balance: 1,
    available: 1,
    equity: 1,
    margin: 1,
    marginLevel: 1,
    leverage: 1,
    pl: 1
};

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(200).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        const user = await UserModel.findById(userId)

        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found"
            });
        }

        const wallet = await DemoWalletModel.findOne({ userId: user._id }).lean();
        if (!wallet) {
            return res.status(200).json({
                success: false,
                message: "Wallet not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet fetched successfully",
            data: wallet
        });

    } catch (error) {
        console.error("Error fetching user data:", error);
        return res.status(200).json({
            success: false,
            message: "Error fetching data",
        });
    }
});

export default router;