import { resend } from "../lib/resend.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a reusable transporter instance (initialized once)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Use environment variables
        pass: process.env.EMAIL_PASS, // App password or SMTP key
    },
});

/**
 * Sends a price alert email using Nodemailer or Resend API
 * @param {string} email - Recipient's email address
 * @param {string} symbol - Crypto or stock symbol
 * @param {number} alertPrice - Alert price triggered
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendVerificationEmail(email, symbol, alertPrice) {
    try {
        const emailBody = `${symbol} price has crossed ${alertPrice}`;

        // First, try sending with Nodemailer
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Price Alert",
            text: emailBody,
        };

        await transporter.sendMail(mailOptions);

        // Optional: Try Resend API only if needed
        // await resend.emails.send({
        //     from: "harsh@hiteshchoudhary.com",
        //     to: email,
        //     subject: "Price Alert",
        //     text: emailBody,
        // });

        return { success: true, message: "Price alert email sent successfully" };
    } catch (error) {
        console.error("Error in sendVerificationEmail =>", error);
        return { success: false, message: "Failed to send price alert email" };
    }
}
