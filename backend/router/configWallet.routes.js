import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();

router.put("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;
        const { balance, equity, available, margin, marginLevel, pl } = req.body;

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await UserModel.findById(userId).populate('demoWallet');
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const demoWallet = await DemoWalletModel.findByIdAndUpdate(
            user.demoWallet._id,
            {
                balance,
                equity,
                available,
                margin,
                ...(marginLevel && { marginLevel }),
                ...(pl && { pl })
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Wallet updated successfully",
            data: demoWallet
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