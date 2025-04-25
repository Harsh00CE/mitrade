import express from "express";
import multer from "multer";
import connectDB from "../ConnectDB/ConnectionDB.js";
import PairInfoModel from "../schemas/pairInfo.js";
import fs from "fs";


const router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/pairLogos/";

        // Ensure directory exists
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.originalname.split('.').pop();
        cb(null, `pair-logo-${unique}.${ext}`);
    }
});


const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        const allowed = ["jpg", "jpeg", "png"];
        const ext = file.originalname.toLowerCase().split(".").pop();
        if (allowed.includes(ext) && file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only .jpg, .jpeg, and .png files are allowed."));
        }
    }
}).fields([{ name: "logo", maxCount: 1 }]);


// API to Create or Update Pair Info
router.post("/", async (req, res) => {
    upload(req, res, async (err) => {
        // await connectDB();

        if (err) {
            return res.status(200).json({ success: false, message: err.message });
        }

        try {
            const {
                symbol,
                volumePerTrade,
                ContractSize,
                maxVolumeOfOpenPosition,
                CurrencyOfQuote,
                floatingSpread,
                OvernightFundingRateBuy,
                OvernightFundingRateSell,
                OvernightFundingRateTime
            } = req.body;


            const logoPath = req.files?.logo?.[0]?.path || "";

            const pairData = {
                volumePerTrade: {
                    min: Number(volumePerTrade?.min),
                    max: Number(volumePerTrade?.max),
                },
                ContractSize: Number(ContractSize),
                maxVolumeOfOpenPosition: Number(maxVolumeOfOpenPosition),
                CurrencyOfQuote,
                floatingSpread: Number(floatingSpread),
                OvernightFundingRateBuy: Number(OvernightFundingRateBuy),
                OvernightFundingRateSell: Number(OvernightFundingRateSell),
                OvernightFundingRateTime,
                ...(logoPath && { logo: logoPath })
            };

            const existingPair = await PairInfoModel.findOneAndUpdate(
                { symbol },
                pairData,
                { new: true, upsert: true }
            );

            res.status(200).json({
                success: true,
                message: "Pair info saved successfully",
                data: existingPair
            });
        } catch (error) {
            console.error("Pair Info Save Error:", error);
            res.status(200).json({ success: false, message: "Internal server error" });
        }
    });
});

export default router;
