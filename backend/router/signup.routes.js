import bcryptjs from "bcryptjs";
import { usernameValidation } from "../schemas/signUpScheme.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import { sendVerificationEmail } from "../helpers/sendVerificationEmail.js";
import express from "express";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();
connectDB();

router.post("/", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username or Email already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verifyCode = Math.floor(Math.random() * 900000 + 100000).toString();
        const expiryDate = new Date(Date.now() + 3600000);

        const newUser = new UserModel({
            username,
            email,
            password: hashedPassword,
            verifyCode,
            verifyCodeExpires: expiryDate,
        });

        // Save the user first
        await newUser.save();

        // Create the demo wallet linked to the user
        const wallet = await DemoWalletModel.create({
            userId: newUser._id,
        });

        // Update the user with the wallet reference
        newUser.demoWallet = wallet._id;
        await newUser.save();

        res.status(201).json({
            success: true,
            message: "User registered successfully. Please check your email for the verification code.",
        });

        sendVerificationEmail(email, username, verifyCode).catch(console.error);
        return;
    } catch (error) {
        console.error("Error in sign-up route =>", error);
        return res.status(500).json({ success: false, message: "Error in sign-up route" });
    }
});


export default router;
