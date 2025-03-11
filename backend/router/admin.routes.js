import { Router } from "express";
import PairInfoModel from "../schemas/pairInfo";

const adminRouter = Router();

adminRouter.post("/", async (req, res) => {
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
        // res.json(pairInfo);

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
        console.error("Error creating Pair Info:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating Pair Info",
        });
    }
});

export default adminRouter;