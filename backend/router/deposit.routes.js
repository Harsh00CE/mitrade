import express from 'express';
import multer from 'multer';

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
    limits: { fileSize: 5 * 1024 * 1024 }
}).fields([
    { name: 'documentFront', maxCount: 1 },
]);

router.post('/', async (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(200).json({ error: 'File upload error', details: err.message });
        } else if (err) {
            return res.status(200).json({ error: 'Server error', details: err.message });
        }

        try {
            const { userId, amount } = req.body;

            // Validate required fields
            if (!userId || !amount ) {
                return res.status(200).json({ error: 'Missing required fields' });
            }


            // Validate amount
            if (isNaN(amount) || amount <= 0) {
                return res.status(200).json({ error: 'Invalid amount' });
            }

            const newDeposit = new Deposit({
                userId,
                amount,
                status: 'pending'
            });

            const savedDeposit = await newDeposit.save();

            res.status(200).json({
                message: 'Deposit submitted successfully',
                data: { id: savedDeposit._id, status: savedDeposit.status }
            });

            return;

        } catch (error) {
            if (error.code === 11000) {
                const field = error.message.includes('email') ? 'email' : 'document number';
                res.status(200).json({ error: `${field} already registered` });
            } else {
                console.error('Deposit submission error:', error);
                res.status(200).json({ error: 'Failed to process deposit submission' });
            }
        }
    });
});

export default router;  