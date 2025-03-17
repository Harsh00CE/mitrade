import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

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
