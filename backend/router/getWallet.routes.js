import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;

        const user = await UserModel.findById(userId).populate("demoWallet");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.demoWallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found for this user",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet data fetched successfully",
            data: user.demoWallet,
        });
    } catch (error) {
        console.error("Error fetching wallet data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;