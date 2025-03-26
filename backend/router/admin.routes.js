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

        const pairData = {
            volumePerTrade,
            leverages,
            ContractSize,
            maxVolumeOfOpenPosition,
            CurrencyOfQuote,
            floatingSpread,
            OvernightFundingRateBuy,
            OvernightFundingRateSell,
            OvernightFundingRateTime,
        };

        const existingPair = await PairInfoModel.findOneAndUpdate(
            { symbol },
            pairData,
            { new: true, upsert: true }
        );

        return res.status(200).json({
            success: true,
            message: existingPair ? "Pair info updated successfully" : "Pair info added successfully",
            data: existingPair,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;
