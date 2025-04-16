import express from "express";
import mongoose from "mongoose";
import UserModel from "../schemas/userSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";


const router = express.Router();

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        console.log("User ID:", userId);


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

        const wallet = await ActiveWalletModel.findOne({ userId: user._id }).lean();
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

router.put("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;
        const { balance, equity, available, margin, leverage, marginLevel, pl } = req.body;

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await UserModel.findById(userId).populate('activeWallet');
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const activeWallet = await ActiveWalletModel.findByIdAndUpdate(
            user.activeWallet._id,
            {
                balance,
                equity,
                available,
                margin,
                leverage,
                ...(marginLevel && { marginLevel }),
                ...(pl && { pl })
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Wallet updated successfully",
            data: activeWallet
        });
    } catch (error) {
        console.error("Error updating wallet:", error);
        return res.status(200).json({
            success: false,
            message: "Internal server error",
        });
    }
});


export default router;