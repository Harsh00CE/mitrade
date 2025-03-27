import express from "express";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { username, code } = req.body;

        // Fetch only required fields and use `.lean()` for performance boost
        const user = await UserModel.findOne({ username })
            .select("+verifyCode +verifyCodeExpires")
            .lean();

        if (!user) {
            return res.status(200).json({ success: false, message: "User not found" });
        }

        const now = new Date();
        if (user.verifyCode !== code) {
            return res.status(200).json({ success: false, message: "Invalid code" });
        }

        if (new Date(user.verifyCodeExpires) < now) {
            return res.status(200).json({ success: false, message: "Code has expired" });
        }

        // Mark user as verified
        await UserModel.updateOne({ username }, { $set: { isVerified: true } });

        return res.status(200).json({ success: true, message: "User verified successfully" });

    } catch (error) {
        console.error("Error in verify-code route =>", error);
        return res.status(200).json({ success: false, message: "Internal server error" });
    }
});

export default router;
