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
            return res.status(200).json({
                success: false,
                message: "Leverages must be provided as an array",
            });
        }

        const pairInfo = await PairInfoModel.create({
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

        if (pairInfo) {
            return res.status(200).json({
                success: true,
                message: "Pair info added successfully",
                data: pairInfo,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Error adding pair info",
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