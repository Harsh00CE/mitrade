import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";

const router = express.Router();

router.post("/", async (req, res) => {
    await connectDB();
    try {
        const {
            symbol,
            volumePerTrade,
            maxLeverage,
            ContractSize,
            maxVolumeOfOpenPosition,
            CurrencyOfQuote,
            floatingSpread,
            OvernightFundingRateBuy,
            OvernightFundingRateSell,
            OvernightFundingRateTime,
        } = req.body;

        const pairInfo = await PairInfoModel.create({
            symbol,
            volumePerTrade,
            maxLeverage,
            ContractSize,
            maxVolumeOfOpenPosition,
            CurrencyOfQuote,
            floatingSpread,
            OvernightFundingRateBuy,
            OvernightFundingRateSell,
            OvernightFundingRateTime,
        });
        res.json(pairInfo);

        if (pairInfo) {
            return res.status(200).json({
                success: true,
                message: "Pair info added successfully",
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Error adding pair info",
            });
        }

    } catch (error) {

    }
});

export default router;