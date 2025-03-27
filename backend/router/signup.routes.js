import bcryptjs from "bcryptjs";
import { usernameValidation } from "../schemas/signUpScheme.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import { sendVerificationEmail } from "../helpers/sendVerificationEmail.js";
import express from "express";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();
connectDB(); // Establish DB connection once

router.post("/", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const parsedUsername = usernameValidation.parse(username);

        // Parallel execution of DB queries
        const [existingUserVerifiedByUsername, existingUserByEmail] = await Promise.all([
            UserModel.findOne({ username: parsedUsername, isVerified: true }).lean(),
            UserModel.findOne({ email }).lean(),
        ]);

        if (existingUserVerifiedByUsername) {
            return res.status(200).json({ success: false, message: "Username already exists" });
        }

        if (existingUserByEmail?.isVerified) {
            return res.status(200).json({ success: false, message: "User already exists with this email" });
        }

        const verifyCode = Math.floor(Math.random() * 900000 + 100000).toString();
        const expiryDate = new Date(Date.now() + 3600000); // 1-hour expiry

        if (existingUserByEmail) {
            // Update unverified user details
            await UserModel.updateOne(
                { email },
                { $set: { password: await bcryptjs.hash(password, 10), verifyCode, verifyCodeExpires: expiryDate } }
            );
        } else {
            // Hash password and create wallet in parallel
            const [hashedPassword, demoWallet] = await Promise.all([
                bcryptjs.hash(password, 10),
                DemoWalletModel.create({}),
            ]);

            // Create new user
            await UserModel.create({
                username: parsedUsername,
                email,
                password: hashedPassword,
                verifyCode,
                verifyCodeExpires: expiryDate,
                isVerified: false,
                isAcceptingMessages: true,
                messages: [],
                demoWallet: demoWallet._id,
            });
        }

        // Send verification email in background (async, doesn't block response)
        sendVerificationEmail(email, username, verifyCode).catch(console.error);

        return res.status(200).json({
            success: true,
            message: "User registered successfully. Please check your email for the verification code.",
        });

    } catch (error) {
        console.error("Error in sign-up route =>", error);
        return res.status(200).json({ success: false, message: "Error in sign-up route" });
    }
});

export default router;
