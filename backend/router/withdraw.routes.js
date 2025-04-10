import express from "express";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";

const router = express.Router();

connectDB().catch(console.error);

router.post("/", async (req, res) => {
    try {
        const { userId, amount, address } = req.body;

        // Input Validation
        if (!userId || !amount || !address) {
            return res.status(200).json({ success: false, message: "Invalid input" });
        }

        // Get user with wallet
        const user = await UserModel.findById(userId)
            .select('demoWallet')
            .populate('demoWallet')

        if (!user || !user.demoWallet) {
            return res.status(200).json({
                success: false,
                message: "User or wallet not found",
            });
        }

        const wallet = user.demoWallet;

        if (wallet.available < amount) {
            return res.status(200).json({
                success: false,
                message: `Insufficient available balance. Required: ${amount}, Available: ${wallet.available}`,
            });
        }

        const newWallet = new DemoWalletModel({
            userId,
            available: parseFloat((wallet.available - amount).toFixed(2)),
            balance: parseFloat((wallet.balance + amount).toFixed(2)),
            equity: parseFloat((wallet.equity + amount).toFixed(2)),
            margin: parseFloat((wallet.margin + amount).toFixed(2)),
            address
        });

        await Promise.all([
            newWallet.save(),
            UserModel.updateOne(
                { _id: userId },
                {
                    $set: { demoWallet: newWallet._id }
                }
            )
        ]);

        res.status(200).json({
            success: true,
            message: "Withdrawal successful",
            data: {
                amount,
                address
            }
        });
    } catch (error) {
        console.error("Withdrawal error:", error);
        return res.status(200).json({
            success: false,
            message: "Withdrawal failed",
            error: error.message
        });
    }
}); 

export default router;