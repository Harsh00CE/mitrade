
import express from "express";
import WithdrawModel from "../schemas/withdrawSchema.js";
import connectDB from "../ConnectDB/ConnectionDB.js";
import UserModel from "../schemas/userSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";

const router = express.Router();

// Connect to the database
connectDB().catch(console.error);

// Handle withdrawal request
router.post("/request", async (req, res) => {
    try {
        const {
            userId,
            amount,
            amountType,
            accountNumber,
            IFSCcode,
            holderName,
            bankName,
        } = req.body;

        // Check if all required fields are present
        if (
            !userId ||
            !amount ||
            !amountType ||
            !accountNumber ||
            !IFSCcode ||
            !holderName ||
            !bankName
        ) {
            return res
                .status(200)
                .json({ success: false, message: "Missing fields" });
        }

        // Find user by ID
        const user = await UserModel.findById(userId);
        if (!user)
            return res
                .status(200)
                .json({ success: false, message: "User not found" });

        // Find user's active wallet
        const wallet = await ActiveWalletModel.findOne({ userId });
        if (!wallet)
            return res
                .status(200)
                .json({ success: false, message: "Wallet not found" });

        // Check if wallet has enough balance
        if (wallet.available < amount) {
            return res.status(200).json({
                success: false,
                message: `Insufficient balance. Required: ${amount}, Available: ${wallet.available}`,
            });
        }

        // Create new withdrawal request
        const newRequest = new WithdrawModel({
            userId,
            amount,
            amountType,
            accountNumber,
            IFSCcode,
            createdAt: new Date(),
            holderName,
            bankName,
        });

        await newRequest.save();

        // Deduct amount from wallet
        wallet.available -= amount;
        wallet.balance -= amount;
        wallet.equity -= amount;
        await wallet.save();

        // Send success response
        res.status(200).json({
            success: true,
            message: "Withdraw request submitted",
            data: newRequest,
        });
    } catch (error) {
        console.error("Withdraw request error:", error);
        res.status(200).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// Approve a withdrawal request
router.post("/approve/:id", async (req, res) => {
    try {
        // Find the withdrawal by ID and ensure it's pending
        const withdraw = await WithdrawModel.findById(req.params.id);
        if (!withdraw || withdraw.status !== "pending") {
            return res.status(200).json({
                success: false,
                message: "Withdrawal not found or already processed",
            });
        }

        // Update status to approved
        withdraw.status = "approved";
        await withdraw.save();

        res.status(200).json({
            success: true,
            message: "Withdrawal approved and amount deducted",
        });
    } catch (error) {
        console.error("Approve error:", error);
        res.status(200).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// Reject a withdrawal request
router.post("/reject", async (req, res) => {
    try {
        const { withdrawId, reason } = req.body;

        // Validate inputs
        if (!withdrawId)
            return res
                .status(200)
                .json({ success: false, message: "Withdrawal ID is required" });
        if (!reason)
            return res
                .status(200)
                .json({ success: false, message: "Reason is required" });

        // Find the withdrawal
        const withdraw = await WithdrawModel.findById(withdrawId);
        if (!withdraw) {
            return res
                .status(200)
                .json({ success: false, message: "Withdrawal not found" });
        }

        // Only pending withdrawals can be rejected
        if (withdraw.status !== "pending") {
            return res.status(200).json({
                success: false,
                message: "Only pending withdrawals can be updated",
            });
        }

        // Find the user's wallet
        const wallet = await ActiveWalletModel.findOne({
            userId: withdraw.userId,
        });
        if (!wallet)
            return res
                .status(200)
                .json({ success: false, message: "Wallet not found" });

        // Update withdrawal status and reason
        withdraw.status = "rejected";
        withdraw.reason = reason || "No reason provided";
        await withdraw.save();

        // Refund the amount to the wallet
        wallet.available += withdraw.amount;
        wallet.balance += withdraw.amount;
        wallet.equity += withdraw.amount;
        await wallet.save();

        res.status(200).json({
            success: true,
            message: "Withdrawal request rejected with reason",
            reason: withdraw.reason,
        });
    } catch (error) {
        console.error("Reject error:", error);
        res.status(200).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// Get all withdrawal requests
router.get("/all", async (req, res) => {
    try {
        const withdrawals = await WithdrawModel.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: withdrawals });
    } catch (error) {
        console.error("Get withdraws error:", error);
        res.status(200).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

export default router;
