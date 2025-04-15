import express from 'express';
import WithdrawModel from '../schemas/withdrawSchema.js';
import connectDB from '../ConnectDB/ConnectionDB.js';
import UserModel from '../schemas/userSchema.js';

const router = express.Router();
connectDB().catch(console.error);

router.post('/request', async (req, res) => {
    try {
        const { userId, amount, amountType, accountNumber, IFSCcode, holderName, bankName } = req.body;

        if (!userId || !amount || !amountType || !accountNumber || !IFSCcode || !holderName || !bankName) {
            return res.status(200).json({ success: false, message: 'Missing fields' });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(200).json({ success: false, message: 'User not found' });

        const newRequest = new WithdrawModel({
            userId, amount, amountType, accountNumber, IFSCcode, createdAt: new Date(), holderName, bankName
        });

        await newRequest.save();
        res.status(200).json({ success: true, message: 'Withdraw request submitted', data: newRequest, success: true });

    } catch (error) {
        console.error('Withdraw request error:', error);
        res.status(200).json({ success: false, message: 'Server error', error: error.message, success: false });
    }
});

import ActiveWalletModel from "../schemas/activeWalletSchema.js";

router.post('/approve/:id', async (req, res) => {
    try {
        const withdraw = await WithdrawModel.findById(req.params.id);
        if (!withdraw || withdraw.status !== 'pending')
            return res.status(200).json({ success: false, message: 'Withdrawal not found or already processed' });

        const wallet = await ActiveWalletModel.findOne({ userId: withdraw.userId });


        if (!wallet) return res.status(200).json({ success: false, message: 'Wallet not found' });

        if (wallet.available < withdraw.amount) {
            return res.status(200).json({
                success: false,
                message: `Insufficient balance. Required: ${withdraw.amount}, Available: ${wallet.available}`,
            });
        }

        wallet.available -= withdraw.amount;
        wallet.balance -= withdraw.amount;
        wallet.equity -= withdraw.amount;
        await wallet.save();

        withdraw.status = 'approved';
        await withdraw.save();

        res.status(200).json({ success: true, message: 'Withdrawal approved and amount deducted' });

    } catch (error) {
        console.error('Approve error:', error);
        res.status(200).json({ success: false, message: 'Server error', error: error.message });
    }
});

router.post('/reject', async (req, res) => {
    try {
        const { withdrawId, reason } = req.body;

        if (!withdrawId) return res.status(200).json({ success: false, message: 'Withdrawal ID is required' });
        if (!reason) return res.status(200).json({ success: false, message: 'Reason is required' });

        const withdraw = await WithdrawModel.findById(withdrawId);

        if (!withdraw) {
            return res.status(200).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        // Allow editing even if already rejected
        if (withdraw.status !== 'rejected' && withdraw.status !== 'pending') {
            return res.status(200).json({
                success: false,
                message: 'Only pending or rejected withdrawals can be updated'
            });
        }


        withdraw.status = 'rejected';
        withdraw.reason = reason || 'No reason provided';
        await withdraw.save();

        res.status(200).json({
            success: true,
            message: 'Withdrawal request rejected with reason',
            reason: withdraw.reason
        });

    } catch (error) {
        console.error('Reject error:', error);
        res.status(200).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});


router.get('/all', async (req, res) => {
    try {
        const withdrawals = await WithdrawModel.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: withdrawals });
    } catch (error) {
        console.error('Get withdraws error:', error);
        res.status(200).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;