import express from "express";
import PairInfoModel from "../schemas/pairInfo.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { symbol } = req.query;

        if (!symbol) {
            return res.status(200).json({
                success: false,
                message: "Symbol is required as a query parameter",
            });
        }

        const pairInfo = await PairInfoModel.findOne({ symbol }).lean();

        if (!pairInfo) {
            return res.status(200).json({
                success: false,
                message: "Pair info not found for the provided symbol",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Pair info retrieved successfully",
            data: pairInfo,
        });

    } catch (error) {
        console.error("Error fetching pair info:", error);
        return res.status(200).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;
