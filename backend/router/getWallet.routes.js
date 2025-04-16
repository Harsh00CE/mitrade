import express from "express";
import UserModel from "../schemas/userSchema.js";
import mongoose from "mongoose";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";

const router = express.Router();


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
        let wallet;

        if (walletType === "demo") {
            wallet = await DemoWalletModel.findById(user.demoWallet);
        } else {
            wallet = await ActiveWalletModel.findById(user.activeWallet);
        }



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