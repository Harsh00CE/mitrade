import express from "express";
import UserModel from "../schemas/userSchema.js";
import bcryptjs from "bcryptjs";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Fetch user with only required fields and optimize query performance
        const user = await UserModel.findOne({ username })
            .select("+password +isVerified")
            .lean();

        if (!user) {
            return res.status(200).json({ success: false, message: "User not found" });
        }

        if (!user.isVerified) {
            return res.status(200).json({ success: false, message: "User not verified" });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(200).json({ success: false, message: "Invalid password" });
        }

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Error in login route =>", error);
        return res.status(200).json({ success: false, message: "Internal server error" });
    }
});

export default router;
