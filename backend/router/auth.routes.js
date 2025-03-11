import { Router } from "express";
import bcryptjs from "bcryptjs";
import passport from "passport";

import UserModel from "../schemas/userSchema";
import { calculateAvailableBalance, calculateBalance, calculateEquity } from "../utils/utilityFunctions";
import DemoWalletModel from "../schemas/demoWalletSchema";
import { usernameValidation } from "../schemas/signUpScheme";
import { sendVerificationEmail } from "../helpers/sendVerificationEmail";

const authRouter = Router();

authRouter.get('/', passport.authenticate("google", { scope: ["email", "profile"] }));

authRouter.get("/callback",
    passport.authenticate("google", { failureRedirect: "/auth/callback/failure" }),
    (req, res) => {
        console.log("User authenticated:", req.user);
        res.redirect("http://localhost:5173/");
    }
);

authRouter.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) console.error(err);
        req.session = null;
        res.redirect("http://localhost:5173");
    });
});

authRouter.post("/login", async (req, res) => {
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

        const isPasswordValid = bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(403).json({
                success: false,
                message: "Invalid password",
            });
        }

        const balance = await calculateBalance(user._id);
        const equity = await calculateEquity(user._id);
        const availableBalance = await calculateAvailableBalance(user._id);

        await DemoWalletModel.findByIdAndUpdate(
            user.demoWallet._id,
            {
                balance,
                equity,
                available: availableBalance,
            }
        );

        const token = jwt.sign({
            id: user._id.toString()
        }, process.env.JWT_USER_SECRET);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                demoWallet: user.demoWallet._id,
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

// signup endpoint still needs some modifications
authRouter.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const parsedUsername = usernameValidation.parse(username);

        log("parsedUsernames => ", parsedUsername);
        log("username => ", username);
        log("email => ", email);
        log("password => ", password);

        // Find existing user with either username or email
        const existingUser = await UserModel.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            let message = "";
            if (existingUser.username === username && existingUser.email === email) {
                message += "Username and Email already exists.";
            } else if (existingUser.username === username) {
                message += "Username already exists.";
            } else if (existingUser.email === email) {
                message += "Email already exists.";
            }
            return res.status(400).json({ message });
        }

        const verifyCode = Math.floor(Math.random() * 900000 + 100000).toString();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);
        const demoWallet = await DemoWalletModel.create({});
        // await demoWallet.save();

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

        // await newUser.save();

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


authRouter.post("/verify-code", async (req, res) => {
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
})

export default authRouter;