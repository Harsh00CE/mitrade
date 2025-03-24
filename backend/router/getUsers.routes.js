import express from "express";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js"; 
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await UserModel.find()
            .populate("demoWallet")
            .skip(skip)
            .limit(limit);

        const totalUsers = await UserModel.countDocuments();

        const formattedUsers = users.map((user) => ({
            userId: user._id,
            username: user.username,
            email: user.email,
            balance: user.demoWallet?.balance || 0,
        }));

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: formattedUsers,
            pagination: {
                totalUsers,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                usersPerPage: limit,
            },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await UserModel.findById(userId).populate("demoWallet");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                balance: user.demoWallet?.balance || 0,
            },
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

export default router;
