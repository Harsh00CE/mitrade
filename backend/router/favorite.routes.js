import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();
    try {
        const { userId, token } = req.body;
        let favBool = false;
        if (!userId || !token) {
            return res.status(200).json({
                success: false,
                message: "User ID and token are required",
            });
        }
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const tokenIndex = user.favoriteTokens.indexOf(token);

        if (tokenIndex !== -1) {
            user.favoriteTokens.splice(tokenIndex, 1);
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Token removed from favorites successfully",
                data: user.favoriteTokens,
            });
        } else {
            user.favoriteTokens.push(token);
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Token added to favorites successfully",
                data: user.favoriteTokens,
            });
        }
    } catch (error) {
        console.error("Error toggling token in favorites:", error);
        return res.status(200).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;