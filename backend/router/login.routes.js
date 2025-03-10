import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import bcryptjs from "bcryptjs";
import { calculateAvailableBalance, calculateBalance, calculateEquity } from "../utils/utilityFunctions.js";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();

    try {
        const { username, password } = req.body;

        const user = await UserModel.findOne({ username }).populate("demoWallet");

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

        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(200).json({
                success: false,
                message: "Invalid password",
            });
        }

        const balance = await calculateBalance(user._id);
        const equity = await calculateEquity(user._id);
        const availableBalance = await calculateAvailableBalance(user._id);


        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id);
        demoWallet.balance = balance;
        demoWallet.equity = equity;
        demoWallet.available = availableBalance;

        await demoWallet.save();

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                demoWallet: demoWallet._id,
            },
        });
    } catch (error) {
        console.error("Error in login route => ", error);
        return res.status(500).json({
            success: false,
            message: "Error in login route",
        });
    }
});

export default router;