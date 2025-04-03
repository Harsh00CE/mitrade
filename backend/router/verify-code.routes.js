import express from "express";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { identifier, code } = req.body; 

        if (!identifier || !code) {
            return res.status(400).json({ success: false, message: "Username or Email and Code are required" });
        }

        // Search by either username or email
        const user = await UserModel.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        })
            .select("+verifyCode +verifyCodeExpires")
            .lean();

        if (!user) {
            return res.status(200).json({ success: false, message: "User not found" });
        }

        const now = new Date();
        if (user.verifyCode !== code) {
            return res.status(200).json({ success: false, message: "Invalid verification code" });
        }

        if (new Date(user.verifyCodeExpires) < now) {
            return res.status(200).json({ success: false, message: "Verification code has expired" });
        }

        // Mark user as verified
        await UserModel.updateOne({ _id: user._id }, { $set: { isVerified: true } });

        return res.status(200).json({ success: true, message: "User verified successfully" });

    } catch (error) {
        console.error("Error in verify-code route:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;
