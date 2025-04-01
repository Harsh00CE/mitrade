import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import mongoose from "mongoose";

const router = express.Router();

router.get("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;

        // Validate userId first
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing user ID",
            });
        }

        // Only query once by using findOne based on valid userId
        const user = await UserModel.findOne({ $or: [{ _id: userId }, { userId: userId }] })
            .lean() 
            .select("favoriteTokens"); 

        // If user is not found
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Return favoriteTokens if found
        return res.status(200).json({
            success: true,
            message: "Favorite tokens retrieved successfully",
            data: user.favoriteTokens || [],
        });
    } catch (error) {
        console.error("Error fetching favorite tokens:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;
