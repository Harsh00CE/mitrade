import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import BasicKYC from "../schemas/KYCSchema.js";
import multer from "multer";
import path from "path";
import fs from "fs";


const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'kyc-doc-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('documentImage');


router.post('/register', (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'File upload error', details: err.message });
        } else if (err) {
            return res.status(500).json({ error: 'Server error', details: err.message });
        }

        try {
            const { fullName, email, mobile, address, nationality, documentType, documentNumber } = req.body;

            // Basic validation
            if (!fullName || !email || !mobile || !nationality || !documentType || !documentNumber) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Document image is required' });
            }

            const newKYC = new BasicKYC({
                fullName,
                email,
                mobile,
                address: address ? JSON.parse(address) : {},
                nationality,
                documentType,
                documentNumber,
                documentImage: req.file.path,
                status: 'pending'
            });

            const savedKYC = await newKYC.save();

            res.status(201).json({
                message: 'KYC registration submitted successfully',
                data: {
                    id: savedKYC._id,
                    status: savedKYC.status
                }
            });
        } catch (error) {
            if (error.code === 11000) {
                // Duplicate key error (email or document number already exists)
                const field = error.message.includes('email') ? 'email' : 'document number';
                res.status(409).json({ error: `${field} already registered` });
            } else {
                console.error('KYC registration error:', error);
                res.status(500).json({ error: 'Failed to process KYC registration' });
            }
        }
    });
});

// Get KYC status
router.get('/status/:id', async (req, res) => {
    try {
        const kycRecord = await BasicKYC.findById(req.params.id).select('status updatedAt');

        if (!kycRecord) {
            return res.status(404).json({ error: 'KYC record not found' });
        }

        res.json({
            status: kycRecord.status,
            lastUpdated: kycRecord.updatedAt
        });
    } catch (error) {
        console.error('KYC status check error:', error);
        res.status(500).json({ error: 'Failed to retrieve KYC status' });
    }
});

// Admin endpoint to list all KYC submissions (protected in real implementation)
router.get('/submissions', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const submissions = await BasicKYC.find(filter)
            .select('fullName email mobile nationality documentType status createdAt')
            .sort({ createdAt: -1 });

        res.json(submissions);
    } catch (error) {
        console.error('Failed to fetch KYC submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

export default router;