import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { usernameValidation } from "../schemas/signUpScheme.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import { sendVerificationEmail } from "../helpers/sendVerificationEmail.js";
import express from "express";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.time("Validation Time");
        const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username or Email already exists" });
        }
        console.timeEnd("Validation Time");

        console.time("Hashing Time");
        const hashedPassword = await bcryptjs.hash(password, 10);
        const verifyCode = Math.floor(Math.random() * 900000 + 100000).toString();
        const expiryDate = new Date(Date.now() + 3600000);
        console.timeEnd("Hashing Time");

        console.time("Saving Time");
        const newUser = new UserModel({
            username,
            email,
            password: hashedPassword,
            verifyCode,
            verifyCodeExpires: expiryDate,
        });

        // Save the user first
        await newUser.save();
        console.timeEnd("Saving Time");

        
        // Create the demo wallet linked to the user
        console.time("1 Demo Wallet Creation Time");
        const wallet = new DemoWalletModel({
            userId: newUser._id,
        });
        await wallet.save();

        // Update the user with the wallet reference
        newUser.demoWallet = wallet._id;
        console.timeEnd("1 Demo Wallet Creation Time");
        console.time("Demo Wallet Creation Time");
        await newUser.save();
        console.timeEnd("Demo Wallet Creation Time");

        console.time("Token Generation Time");
        // Generate JWT Token
        const token = jwt.sign(
            { id: newUser._id, username: newUser.username, email: newUser.email },
            process.env.JWT_SECRET, // Make sure to set this in your environment variables
            { expiresIn: "7d" } // Token expires in 7 days
        );
        console.timeEnd("Token Generation Time");

        res.status(201).json({
            success: true,
            message: "User registered successfully. Please check your email for the verification code.",
            token, // Return the token
        });

        sendVerificationEmail(email, username, verifyCode).catch(console.error);
        return;
    } catch (error) {
        console.error("Error in sign-up route =>", error);
        return res.status(500).json({ success: false, message: "Error in sign-up route" });
    }
});

export default router;
