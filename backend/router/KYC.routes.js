import express from "express";
import BasicKYC from "../schemas/KYCSchema.js";
import multer from "multer";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";
import mongoose from "mongoose";
import UserModel from "../schemas/userSchema.js";

const router = express.Router();

const path = (await import('path')).default;

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    const isMimeValid = allowedMimeTypes.includes(mime);
    const isExtValid = allowedExtensions.includes(ext);

    if (isMimeValid || isExtValid) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false);
    }
};


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'kyc-doc-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
}).fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 }
]);


router.post('/register', (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(200).json({ message: 'File upload error', details: err.message });
        } else if (err) {
            return res.status(200).json({ message: 'Server error', details: err.message });
        }

        try {
            const { userId, fname, lname, mname, email, mobile, address, nationality, documentType, documentNumber } = req.body;

            // Validate required fields
            if (!fname || !lname || !mname || !email || !mobile || !nationality || !documentType || !documentNumber) {
                return res.status(200).json({ message: 'Missing required fields' });
            }

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(200).json({ message: 'User not found' });
            }

            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(200).json({ message: 'Invalid or missing userId' });
            }

            const existingKYC = await BasicKYC.findOne({ userId });
            if (existingKYC) {
                return res.status(200).json({ message: 'KYC already submitted for this userId' });
            }


            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(200).json({ message: "Invalid email format" });
            }
            // Validate mobile format
            if (!/^[0-9]{10,15}$/.test(mobile)) {
                return res.status(200).json({ message: "Invalid mobile number format" });
            }

            // Ensure correct number of images is uploaded
            if (documentType === 'national_id') {
                if (!req.files || !req.files.documentFront || !req.files.documentBack) {
                    return res.status(200).json({ message: "Both front and back images are required for national ID" });
                }
            } else {
                if (!req.files || !req.files.documentFront) {
                    return res.status(200).json({ message: "Document image is required" });
                }
            }
            const getISTDate = () => {
                const now = new Date();
                const istOffset = 5.5 * 60;
                const istTime = new Date(now.getTime() + istOffset * 60 * 1000);
                return istTime;
            };

            // console.log("File => ", req.files.documentFront);
            // console.log("File1 => ", req.files.documentFront[0].path);

            // console.log("File3 => ", req.files.documentBack);
            // console.log("File2 => ", req.files.documentBack[0].path);


            const newKYC = new BasicKYC({
                userId,
                fname,
                mname,
                lname,
                // gender,
                // dateOfBirth,
                email,
                mobile,
                // address: address ? JSON.parse(address) : {},
                address: address,
                nationality,
                documentType,
                documentNumber,
                documentImage: {
                    front: req.files.documentFront ? req.files.documentFront[0].path : null,
                    back: req.files.documentBack ? req.files.documentBack[0].path : null
                },
                status: 'pending',
                registrationDate: getISTDate()
            });

            const savedKYC = await newKYC.save();

            const wallet = new ActiveWalletModel({
                userId: userId,
            });
            wallet.leverage = 1;
            await wallet.save();

            user.activeWallet = wallet._id;
            await user.save();


            return res.status(200).json({
                message: 'KYC registration submitted successfully',
                data: { id: savedKYC._id, status: savedKYC.status },
                success: true
            });

        } catch (error) {
            if (error.code === 11000) {
                const field = error.message.includes('email') ? 'email' : 'document number';
                res.status(200).json({
                    message: `${field} already registered`,
                    success: false
                },);

            } else {
                console.error('KYC registration error:', error);
                res.status(200).json({
                    message: 'Failed to process KYC registration',
                    success: false
                });
            }
        }
    });
});

router.get('/data/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const kycRecord = await BasicKYC.findOne({ userId });


        if (!kycRecord) {
            return res.status(200).json({ message: 'KYC record not found', success: false });
        }

        return res.status(200).json({
            message: 'KYC status retrieved successfully',
            success: true,
            data: kycRecord
        });

    } catch (error) {
        console.error('KYC status check error:', error);
        res.status(200).json({ error: 'Failed to retrieve KYC status' });
    }
});


router.put('/update-status/:id', async (req, res) => {
    try {
        const { status, reason } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const updateFields = { status };
        if (status === 'rejected') {
            updateFields.reason = reason || ''; // Optional: prevent null value
        } else {
            updateFields.reason = ''; // Clear reason if not rejected
        }

        const updated = await BasicKYC.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        ).select('status reason updatedAt');

        if (!updated) {
            return res.status(404).json({ error: 'KYC record not found' });
        }

        res.status(200).json({
            message: 'KYC status updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Failed to update KYC status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});



router.get('/all', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const submissions = await BasicKYC.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Submissions fetched successfully',
            data: submissions.map(user => ({
                ...user._doc,
                documentImage: {
                    front: user.documentImage?.front
                        ? `${req.protocol}://${req.get('host')}/${user.documentImage.front.replace(/\\/g, '/')}`
                        : null,
                    back: user.documentImage?.back
                        ? `${req.protocol}://${req.get('host')}/${user.documentImage.back.replace(/\\/g, '/')}`
                        : null,
                }
            }))
        });

    } catch (error) {
        console.error('Failed to fetch KYC submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});



router.patch('/update-data/:id', (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: 'Multer upload error', details: err.message });
        } else if (err) {
            return res.status(500).json({ message: 'File upload error', details: err.message });
        }

        try {
            const kycId = req.params.id;
            const updateFields = req.body;

            const allowedFields = [
                'fname', 'lname', 'mname', 'email', 'mobile',
                'address', 'nationality', 'documentType', 'documentNumber'
            ];

            const validUpdates = {};
            for (let key of allowedFields) {
                if (updateFields[key] !== undefined) {
                    validUpdates[key] = updateFields[key];
                }
            }

            if (req.files?.documentFront) {
                validUpdates['documentImage.front'] = req.files.documentFront[0].path;
            }
            if (req.files?.documentBack) {
                validUpdates['documentImage.back'] = req.files.documentBack[0].path;
            }

            if (Object.keys(validUpdates).length === 0) {
                return res.status(400).json({ message: 'No valid fields or files to update' });
            }

            validUpdates.status = 'pending';

            const updatedKYC = await BasicKYC.findByIdAndUpdate(
                kycId,
                { $set: validUpdates },
                { new: true }
            );

            if (!updatedKYC) {
                return res.status(404).json({ message: 'KYC record not found' });
            }

            res.status(200).json({
                message: 'KYC data updated successfully, status reset to pending',
                success: true,
                data: updatedKYC
            });
        } catch (error) {
            console.error('KYC update error:', error);
            res.status(500).json({ message: 'Failed to update KYC record' });
        }
    });
});





export default router;