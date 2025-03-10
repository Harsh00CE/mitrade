import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();
    try {
        const { username, code } = req.body;

        const decodedUsername = decodeURIComponent(username);
        const decodedCode = decodeURIComponent(code);


        const user = await UserModel.findOne({
            username: decodedUsername,
        });

        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }
        console.log("decodedUsername => ", decodedUsername);
        console.log("decodedCode => ", decodedCode);
        console.log("user code => ", user.verifyCode);

        const isCodeValid = user.verifyCode == decodedCode;
        const isCodeExpired = new Date(user.verifyCodeExpires) < new Date();

        console.log("isCodeValid => ", isCodeValid);
        console.log("isCodeExpired => ", isCodeExpired);

        if (isCodeValid && !isCodeExpired) {
            user.isVerified = true;
            await user.save();
            return res.status(200).json({
                success: true,
                message: "User verified successfully",
            });
        } else if (isCodeValid && isCodeExpired) {
            return res.status(200).json({
                success: false,
                message: "Code is valid but has expired",
            });
        } else {
            return res.status(200).json({
                success: false,
                message: "Code is invalid",
            });
        }

    } catch (error) {
        console.log("Error in verify-code route => ", error);
        return res.status(500).json({
            success: false,
            message: "Error in verify-code route",
        });
    }
});

export default router;