import express from "express";
import dotenv from "dotenv";
import connectDB from "../ConnectDB/ConnectionDB.js";
import AlertModel from "../schemas/alertSchema.js";
import UserModel from "../schemas/userSchema.js";
import { sendVerificationEmail } from "../helpers/sendAlertEmail.js";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
    // await connectDB();
    try {
        const { symbol, currentPrice } = req.body;


        if (!symbol || !currentPrice) {
            return res.status(200).json({
                success: false,
                message: "Symbol and currentPrice are required",
            });
        }

        const alerts = await AlertModel.find({ symbol });



        if (!alerts || alerts.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No alerts found for this symbol",
            });
        }

        for (const alert of alerts) {
            const { userId, alertPrice, alertType } = alert;

            const user = await UserModel.findById(userId);

            if (user && user.email) {
                await sendVerificationEmail(user.email, symbol, alertPrice);

                alert.triggered = true;
                await alert.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Email alerts processed successfully",
        });
    } catch (error) {
        console.error("Error processing email alerts:", error);
        return res.status(200).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;