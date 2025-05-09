import express from "express";
import mongoose from "mongoose";
import UserModel from "../schemas/userSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

async function get_wallet_data(req, res) {
    try {
        const { userId } = req.params;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(200).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        const user = await UserModel.findById(userId)
            .populate("demoWallet")
            .populate("activeWallet")
            .lean();

        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.walletType) {
            return res.status(200).json({
                success: false,
                message: "User wallet type not found",
            });
        }

        if (!user.demoWallet && !user.activeWallet) {
            return res.status(200).json({
                success: false,
                message: "User wallet not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet fetched successfully",
            data: {
                activeWallet: user.activeWallet,
                demoWallet: user.demoWallet,
                walletType: user.walletType,
                userId: user._id,
            },
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        return res.status(200).json({
            success: false,
            message: "Error fetching data",
        });
    }
}

export { get_wallet_data };
