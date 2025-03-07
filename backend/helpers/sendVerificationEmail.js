import { resend } from "../lib/resend.js";
import nodemailer from "nodemailer";

export async function sendVerificationEmail(email, username, verifyCode) {
  try {
    console.log("email in sendVerificationEmail => ", email);
    console.log("username in sendVerificationEmail => ", username);
    console.log("verifyCode in sendVerificationEmail => ", verifyCode);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "harshradadiya9999@gmail.com",
        pass: "oolaedzyrvepevsn",
      },
    });

    // const emailHtml = await render(VerificationEmail({ username, otp: verifyCode }));

    const options = {
      from: "harshradadiya9999@gmail.com",
      to: email,
      subject: "Verify your email",
      text : `Your OTP code is ${verifyCode}`
    };

    await transporter.sendMail(options);

    await resend.emails.send({
      from: "harsh@hiteshchoudhary.com",
      to: email,
      subject: "Verify your email",
      text : `Your OTP code is ${verifyCode}`
    });

    return {
      success: true,
      message: "Email sent successfully",
      isAcceptingMessages: false,
      messages: undefined,
    };
  } catch (error) {
    console.log("Error in sendVerificationEmail => ", error);
    return {
      success: false,
      message: "Error in sendVerificationEmail",
      isAcceptingMessages: false,
      messages: undefined,
    };
  }
}