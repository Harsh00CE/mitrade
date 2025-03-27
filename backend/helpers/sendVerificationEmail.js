import { resend } from "../lib/resend.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});

/**
 * Sends a verification email using Nodemailer or Resend API
 * @param {string} email - Recipient's email address
 * @param {string} username - Recipient's username
 * @param {string} verifyCode - One-time verification code
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendVerificationEmail(email, username, verifyCode) {
    try {
        const emailBody = `Your OTP code is ${verifyCode}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email",
            text: emailBody,
        };

        await transporter.sendMail(mailOptions);

        // Alternative: Try Resend API only if Nodemailer fails
        await resend.emails.send({
            from: "harsh@hiteshchoudhary.com",
            to: email,
            subject: "Verify your email",
            text: emailBody,
        });

        return { success: true, message: "Email sent successfully" };
    } catch (error) {
        console.error("Error in sendVerificationEmail =>", error);
        return { success: false, message: "Failed to send verification email" };
    }
}
