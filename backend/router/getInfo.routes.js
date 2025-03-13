import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import PairInfoModel from "../schemas/pairInfo.js";

const router = express.Router();

router.get("/", async (req, res) => {
    await connectDB();
    try {
        const { symbol } = req.query; 
        if (!symbol) {
            return res.status(200).json({
                success: false,
                message: "Symbol is required as a query parameter",
            });
        }

        const pairInfo = await PairInfoModel.findOne({ symbol });

        if (pairInfo) {
            return res.status(200).json({
                success: true,
                message: "Pair info retrieved successfully",
                data: pairInfo, 
            });
        } else {
            return res.status(200).json({
                success: false,
                message: "Pair info not found for the provided symbol",
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