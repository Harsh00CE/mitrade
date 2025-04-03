import express from "express";
import UserModel from "../schemas/userSchema.js";
import { sendVerificationEmail } from "../helpers/sendVerificationEmail.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { email } = req.body;

        // Check if email exists and fetch only required fields
        const user = await UserModel.findOne({ email })
            .select("username email isVerified")
            .lean();

        if (!user) {
            return res.status(200).json({ success: false, message: "User not found" });
        }

        if (!user.isVerified) {
            return res.status(200).json({ success: false, message: "User is not verified" });
        }

        // Generate verification code and expiry
        const verifyCode = Math.floor(Math.random() * 900000 + 100000).toString();
        const expiryDate = new Date(Date.now() + 3600000); // 1 hour expiry

        // Update user document without fetching the entire object
        await UserModel.updateOne(
            { email },
            { $set: { verifyCode, verifyCodeExpires: expiryDate } }
        );

        // Send email asynchronously
        sendVerificationEmail(user.email, user.username, verifyCode).catch(console.error);

        return res.status(200).json({ success: true, message: "Verification code sent to email" });

    } catch (error) {
        console.error("Error in verification code request =>", error);
        return res.status(200).json({ success: false, message: "Internal server error" });
    }
});

export default router;
