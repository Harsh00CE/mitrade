import express from "express";
import AdminAccountDetails from "../schemas/adminAccountDetails.js";
import upload from "../utils/multer.js";
import path from "path";

const router = express.Router();

router.post("/", upload.single("qrCodeImage"), async (req, res) => {
    try {
        const { accountNumber, holderName, IFSCcode, bankName, usdtAddress, usdtType } = req.body;
        const qrCodeImage = req.file?.filename;

        if (!accountNumber || !holderName || !IFSCcode || !bankName || !usdtAddress || !usdtType) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        const existing = await AdminAccountDetails.findOne();

        if (existing) {
            existing.accountNumber = accountNumber;
            existing.holderName = holderName;
            existing.IFSCcode = IFSCcode;
            existing.bankName = bankName;
            existing.usdtAddress = usdtAddress;
            existing.usdtType = usdtType;
            if (qrCodeImage) existing.qrCodeImage = qrCodeImage;

            await existing.save();

            return res.status(200).json({
                success: true,
                message: "Admin account details updated successfully",
                data: existing,
            });
        } else {
            const newDetails = await AdminAccountDetails.create({
                accountNumber,
                holderName,
                IFSCcode,
                bankName,
                usdtAddress,
                usdtType,
                qrCodeImage,
            });

            return res.status(200).json({
                success: true,
                message: "Admin account details saved successfully",
                data: newDetails,
            });
        }
    } catch (error) {
        console.error("Error saving admin account:", error);
        return res.status(500).json({
            success: false,
            message: "Error saving admin account",
        });
    }
});
router.get("/", async (req, res) => {
    try {
        const details = await AdminAccountDetails.findOne();
        if (!details) {
            return res.status(404).json({
                success: false,
                message: "No admin bank details found",
            });
        }
        return res.status(200).json({
            success: true,
            data: details,
        });
    } catch (error) {
        console.error("Error fetching admin account:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching admin account",
        });
    }
});

export default router;
