import express from "express";
import AdminAccountDetails from "../schemas/adminAccountDetails.js";

const router = express.Router();

// ✅ Create or Replace Admin Bank Details
router.post("/", async (req, res) => {
    try {
        const { accountNumber, holderName, IFSCcode, bankName } = req.body;

        if (!accountNumber || !holderName || !IFSCcode || !bankName) {
            return res.status(200).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Check if a record already exists (only one admin account assumed)
        const existing = await AdminAccountDetails.findOne();

        if (existing) {
            // Update the existing one
            existing.accountNumber = accountNumber;
            existing.holderName = holderName;
            existing.IFSCcode = IFSCcode;
            existing.bankName = bankName;
            await existing.save();

            return res.status(200).json({
                success: true,
                message: "Admin account details updated successfully",
                data: existing,
            });
        } else {
            // Create new record
            const newDetails = await AdminAccountDetails.create({
                accountNumber,
                holderName,
                IFSCcode,
                bankName,
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
