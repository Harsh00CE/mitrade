import bcryptjs from "bcryptjs";
import { log } from "console";
import { usernameValidation } from "../schemas/signUpScheme.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import { sendVerificationEmail } from "../helpers/sendVerificationEmail.js";
import express from "express";
import DemoWalletModel from "../schemas/demoWalletSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();
    try {
        const { username, email, password } = req.body;

        const parsedUsername = usernameValidation.parse(username);

        log("parsedUsernames => ", parsedUsername);
        log("username => ", username);
        log("email => ", email);
        log("password => ", password);

        const existingUserVerifiedByUsername = await UserModel.findOne({
            username: parsedUsername,
            isVerified: true,
        });

        if (existingUserVerifiedByUsername) {
            return res.status(200).json({
                success: false,
                message: "Username already exists",
            });
        }

        const existingUserByEmail = await UserModel.findOne({ email });
        log("existingUserByEmail => ", existingUserByEmail);

        const verifyCode = Math.floor(Math.random() * 900000 + 100000).toString();

        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                return res.status(200).json({
                    success: false,
                    message: "User already exists with this email",
                });
            } else {
                const hashedPassword = await bcryptjs.hash(password, 10);
                existingUserByEmail.password = hashedPassword;
                existingUserByEmail.verifyCode = verifyCode;
                existingUserByEmail.verifyCodeExpires = new Date(Date.now() + 60000);

                await existingUserByEmail.save();
            }
        } else {
            const hashedPassword = await bcryptjs.hash(password, 10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);
            const demoWallet = await DemoWalletModel.create({});
            await demoWallet.save();

            const newUser = await UserModel.create({
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

            await newUser.save();
        }

        const emailResponse = await sendVerificationEmail(email, username, verifyCode);
        if (emailResponse.success) {
            return res.status(200).json({
                success: true,
                message: "User Registered Successfully. Please check your email for verification code",
            });
        } else {
            return res.status(500).json({
                success: false,
                message: emailResponse.message,
            });
        }
    } catch (error) {
        console.log("Error in sign-up route => ", error);
        return res.status(500).json({
            success: false,
            message: "Error in sign-up route",
        });
    }
});

export default router;