import { resend } from "../lib/resend.js";
import nodemailer from "nodemailer";

export async function sendVerificationEmail(email, symbol, alertPrice) {
  try {

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "harshradadiya9999@gmail.com",
        pass: "oolaedzyrvepevsn",
      },
    });

    const options = {
      from: "harshradadiya9999@gmail.com",
      to: email,
      subject: "Price Alert",
      text : `${symbol} price has crossed ${alertPrice}`
    };

    await transporter.sendMail(options);

    await resend.emails.send({
      from: "harsh@hiteshchoudhary.com",
      to: email,
      subject: "Price Alert",
      text : `${symbol} price has crossed ${alertPrice}`
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