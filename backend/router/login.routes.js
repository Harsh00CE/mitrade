import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await UserModel.findOne({ username })
            .select("+password +isVerified")
            .lean();

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        if (!user.isVerified) {
            return res.status(400).json({ success: false, message: "User not verified" });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid password" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET, 
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Error in login route =>", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;
