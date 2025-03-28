import express from "express";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }
        const user = await UserModel.findById(userId)
            .populate({ path: "demoWallet", select: "balance available equity" })
            .lean(); 

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.demoWallet) {
            return res.status(404).json({ success: false, message: "Wallet not found for this user" });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet data fetched successfully",
            data: user.demoWallet,
        });
    } catch (error) {
        console.error("Error fetching wallet data:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;
