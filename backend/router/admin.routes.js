import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import PairInfoModel from "../schemas/pairInfo.js";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();
    try {
        const {
            symbol,
            volumePerTrade,
            leverages,
            ContractSize,
            maxVolumeOfOpenPosition,
            CurrencyOfQuote,
            floatingSpread,
            OvernightFundingRateBuy,
            OvernightFundingRateSell,
            OvernightFundingRateTime,
        } = req.body;

        if (!Array.isArray(leverages)) {
            return res.status(400).json({
                success: false,
                message: "Leverages must be provided as an array",
            });
        }

        // Check if the symbol already exists
        const existingPair = await PairInfoModel.findOne({ symbol });

        if (existingPair) {
            // Update existing pair info
            const updatedPair = await PairInfoModel.findOneAndUpdate(
                { symbol },
                {
                    volumePerTrade,
                    leverages,
                    ContractSize,
                    maxVolumeOfOpenPosition,
                    CurrencyOfQuote,
                    floatingSpread,
                    OvernightFundingRateBuy,
                    OvernightFundingRateSell,
                    OvernightFundingRateTime,
                },
                { new: true } // Return the updated document
            );

            return res.status(200).json({
                success: true,
                message: "Pair info updated successfully",
                data: updatedPair,
            });
        } else {
            // Create new pair info
            const newPair = await PairInfoModel.create({
                symbol,
                volumePerTrade,
                leverages,
                ContractSize,
                maxVolumeOfOpenPosition,
                CurrencyOfQuote,
                floatingSpread,
                OvernightFundingRateBuy,
                OvernightFundingRateSell,
                OvernightFundingRateTime,
            });

            return res.status(201).json({
                success: true,
                message: "Pair info added successfully",
                data: newPair,
            });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;
