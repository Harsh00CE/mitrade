import express from "express";
import bcryptjs from "bcryptjs";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Validate required fields
        if (!email || !newPassword ) {
            return res.status(200).json({ success: false, message: "Email, new password, and verification code are required" });
        }

        // Fetch only required fields
        const user = await UserModel.findOne({ email })
            .lean();

        if (!user) {
            return res.status(200).json({ success: false, message: "User not found" });
        }

 
        // Hash new password
        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        await UserModel.findOneAndUpdate(
            { email },
            { $set: { password: hashedPassword }},
            { new: true }
        );

        return res.status(200).json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        console.error("Error in password reset route =>", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;
