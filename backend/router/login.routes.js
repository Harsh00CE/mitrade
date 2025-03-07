import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import { UserModel } from "../schemas/userSchema.js";
import bcryptjs from "bcryptjs";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();

    try {
        const { username, password } = req.body;

        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }
        if (!user.isVerified) {
            return res.status(200).json({
                success: false,
                message: "User not verified",
            });
        }

        const isPaawordValid = await bcryptjs.compare(password, user.password);

        if (isPaawordValid) {
            return res.status(200).json({
                success: true,
                message: "User logged in successfully",
            });
        } else {
            return res.status(200).json({
                success: false,
                message: "Invalid password",
            });
        }

    } catch (error) {
        console.log("Error in login route => ", error);
        return res.status(500).json({
            success: false,
            message: "Error in login route",
        });
    }


});

export default router;
