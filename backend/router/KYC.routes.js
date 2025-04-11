import express from "express";
import BasicKYC from "../schemas/KYCSchema.js";
import multer from "multer";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";

const router = express.Router();

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
    limits: { fileSize: 5 * 1024 * 1024 } 
}).fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 }
]);

router.post('/register', (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(200).json({ error: 'File upload error', details: err.message });
        } else if (err) {
            return res.status(200).json({ error: 'Server error', details: err.message });
        }

        try {
            const { userId, fname ,lname , mname, email, mobile, address, nationality, documentType, documentNumber } = req.body;

            // Validate required fields
            if (!fname || !lname || !mname || !email || !mobile || !nationality || !documentType || !documentNumber || !userId) {
                return res.status(200).json({ error: 'Missing required fields' });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(200).json({ error: "Invalid email format" });
            }
            // Validate mobile format
            if (!/^[0-9]{10,15}$/.test(mobile)) {
                return res.status(200).json({ error: "Invalid mobile number format" });
            }

            // Ensure correct number of images is uploaded
            if (documentType === 'national_id') {
                if (!req.files || !req.files.documentFront || !req.files.documentBack) {
                    return res.status(200).json({ error: "Both front and back images are required for national ID" });
                }
            } else {
                if (!req.files || !req.files.documentFront) {
                    return res.status(200).json({ error: "Document image is required" });
                }
            }
            const getISTDate = () => {
                const now = new Date();
                const istOffset = 5.5 * 60; 
                const istTime = new Date(now.getTime() + istOffset * 60 * 1000);
                return istTime;
            };
    
            console.log("File => " , req.files.documentFront);
            console.log("File1 => " , req.files.documentFront[0].path);

            console.log("File3 => " , req.files.documentBack);
            console.log("File2 => " , req.files.documentBack[0].path);
            

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
            await wallet.save();

            res.status(200).json({
                message: 'KYC registration submitted successfully',
                data: { id: savedKYC._id, status: savedKYC.status }
                
            });

            return;

        } catch (error) {
            if (error.code === 11000) {
                const field = error.message.includes('email') ? 'email' : 'document number';
                res.status(200).json({ error: `${field} already registered` });
            } else {
                console.error('KYC registration error:', error);
                res.status(200).json({ error: 'Failed to process KYC registration' });
            }
        }
    });
});

router.get('/status/:id', async (req, res) => {
    try {

        const {userId} = req.params;
        const kycRecord = await BasicKYC.findOne({userId}).select('status updatedAt');
        if (!kycRecord) {
            return res.status(200).json({ error: 'KYC record not found' });
        }
        const { status, updatedAt } = kycRecord;
        const lastUpdated = updatedAt.toDate();
       
        
    } catch (error) {
        console.error('KYC status check error:', error);
        res.status(200).json({ error: 'Failed to retrieve KYC status' });
    }
});

router.put('/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(200).json({ error: 'Invalid status value' });
        }

        const updated = await BasicKYC.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select('status updatedAt');

        if (!updated) {
            return res.status(200).json({ error: 'KYC record not found' });
        }

        res.status(200).json({
            message: 'KYC status updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Failed to update KYC status:', error);
        res.status(200).json({ error: 'Failed to update status' });
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
        res.status(500).json({ error: 'Failed to fetch submissions' }); // changed to 500 for real error
    }
});



export default router;