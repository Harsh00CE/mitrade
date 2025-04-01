import express from "express";
import UserModel from "../schemas/userSchema.js";
import bcryptjs from "bcryptjs";
import { generateToken } from "../middleware/authUtils.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Fetch user with password and verification status
        const user = await UserModel.findOne({ username })
            .select("+password +isVerified")
            .lean();

        if (!user) {
            return res.status(200).json({ 
                success: false, 
                message: "Invalid credentials" // Don't reveal if user exists
            });
        }

        if (!user.isVerified) {
            return res.status(200).json({ 
                success: false, 
                message: "Please verify your email first" 
            });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(200).json({ 
                success: false, 
                message: "Invalid credentials" // Generic message for security
            });
        }

        // Generate token using the method we added to the schema
        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                token // Send the token to the client
            },
        });

    } catch (error) {
        console.error("Error in login route =>", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
});

export default router;