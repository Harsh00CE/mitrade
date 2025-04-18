import express from 'express';
import multer from 'multer';

import UserModel from '../schemas/userSchema.js'; // adjust path if needed
import DepositModel from '../schemas/depositSchema.js';
import ActiveWalletModel from '../schemas/activeWalletSchema.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'deposit-doc-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedExtensions = /jpeg|jpg|png/;
        const ext = file.originalname.toLowerCase().split('.').pop();
        const extname = allowedExtensions.test(ext);
        const mimetypeOk = file.mimetype.startsWith("image/") || file.mimetype === "application/octet-stream";

        if (extname && mimetypeOk) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, and .png image files are allowed!'));
        }
    }

}).fields([
    { name: 'documentImage', maxCount: 1 },
]);

router.post('/', async (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(200).json({ message: 'File upload error', details: err.message });
        } else if (err) {
            return res.status(200).json({ message: 'Server error', details: err.message, success: false });
        }

        try {
            const { userId, amount, amountType, utr } = req.body;

            // Validate required fields
            if (!userId || !amount || !amountType) {
                return res.status(200).json({ message: 'Missing required fields' });
            }

            // Validate amount
            if (isNaN(amount) || amount <= 0) {
                return res.status(200).json({ message: 'Invalid amount' });
            }

            const newDeposit = new DepositModel({
                userId,
                amount,
                amountType,
                utr,
                status: 'pending',
                documentImage: req.files?.documentImage?.[0]?.path || ''
            });

            const savedDeposit = await newDeposit.save();

            return res.status(200).json({
                message: 'Deposit submitted successfully',
                data: { id: savedDeposit._id, status: savedDeposit.status },
                success: true
            });


        } catch (error) {
            if (error.code === 11000) {
                const field = error.message.includes('email') ? 'email' : 'document number';
                res.status(200).json({ message: `${field} already registered`, success: false });
            } else {
                console.error('Deposit submission error:', error);
                res.status(200).json({ message: 'Failed to process deposit submission' });
            }
        }
    });
});


// Approve Deposit API
router.post('/approve/:id', async (req, res) => {
    try {
        const depositId = req.params.id;
        const deposit = await DepositModel.findById(depositId);


        if (!deposit) return res.status(200).json({ message: 'Deposit not found' });
        if (deposit.status !== 'pending') return res.status(200).json({ message: 'Deposit already processed' });

        const user = await UserModel.findById(deposit.userId);
        if (!user) return res.status(200).json({ message: 'User not found' });

        const wallet = await ActiveWalletModel.findById(user.activeWallet);
        if (!wallet) return res.status(200).json({ message: 'Wallet not found' });

        wallet.balance = parseFloat((wallet.balance + deposit.amount).toFixed(2));
        wallet.available = parseFloat((wallet.available + deposit.amount).toFixed(2));
        wallet.equity = parseFloat((wallet.equity + deposit.amount).toFixed(2));

        await wallet.save();


        // Update deposit status
        deposit.status = 'approved';
        await deposit.save();

        res.status(200).json({ message: 'Deposit approved and balance updated' });
    } catch (error) {
        console.error('Error approving deposit:', error);
        res.status(200).json({ message: 'Failed to approve deposit' });
    }
});

router.post('/reject', async (req, res) => {
    try {
        const { depositId, reason } = req.body;

        if (!depositId || !reason) {
            return res.status(200).json({ success: false, message: 'Deposit ID and reason are required' });
        }

        const deposit = await DepositModel.findById(depositId);

        if (!deposit) {
            return res.status(200).json({ success: false, message: 'Deposit not found' });
        }

        if (deposit.status === 'approved') {
            return res.status(200).json({ success: false, message: 'Deposit already approved, cannot reject' });
        }

        deposit.status = 'rejected';
        deposit.reason = reason;
        await deposit.save();

        return res.status(200).json({
            success: true,
            message: 'Deposit rejection reason updated',
            reason: deposit.reason
        });

    } catch (error) {
        console.error('Deposit reject error:', error);
        return res.status(200).json({ success: false, message: 'Server error', error: error.message });
    }
});




router.get('/all', async (req, res) => {
    try {
        const deposits = await DepositModel.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: deposits
        });
    } catch (error) {
        console.error('Failed to fetch deposits:', error);
        res.status(200).json({ message: 'Failed to fetch deposits', success: false });
    }
});

router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const deposits = await DepositModel.find({ userId });

        res.status(200).json({
            message: 'Deposits fetched successfully',
            data: deposits
            , success: true
        });
    } catch (error) {
        console.error('Failed to fetch deposits:', error);
        res.status(200).json({ message: 'Failed to fetch deposits', success: false });
    }
});


export default router;  