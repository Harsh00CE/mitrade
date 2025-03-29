import express from "express";
import UserModel from "../schemas/userSchema.js";
import mongoose from "mongoose";

const router = express.Router();


const WALLET_PROJECTION = {
    balance: 1,
    available: 1,
    equity: 1,
    margin: 1,
    marginLevel: 1,
    pl: 1
};

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Ultra-fast validation
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid user ID format" 
            });
        }

        // Single optimized query with population
        const user = await UserModel.findById(userId)
            .populate({
                path: "demoWallet",
                select: WALLET_PROJECTION
            })
            .lean()
            .exec();

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            data: user.demoWallet || null,
        });

    } catch (error) {
        console.error("Error fetching user data:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error fetching data",
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

export default router;