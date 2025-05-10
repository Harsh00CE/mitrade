import RateModel from "../schemas/rateSchema.js";

const UpdateRate = async (req, res) => {
    try {
        const { currency, rate } = req.body;
        if (!currency || !rate) {
            return res.status(200).json({
                success: false,
                message: "Missing fields",
            });
        }

        const rateDoc = await RateModel.findOneAndUpdate(
            { currency },
            { currency, rate },
            { upsert: true, new: true }
        );

        if (!rateDoc) {
            return res.status(200).json({
                success: false,
                message: "Rate not found",
            });
        }

        res.status(200).json({ success: true, data: rateDoc });
    } catch (error) {
        console.error("Error updating rate:", error);
        res.status(200).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const GetRates = async (req, res) => {
    try {
        const rates = await RateModel.find().lean();
        if (!rates || rates.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No rates found",
            });
        }
        res.status(200).json({ success: true, data: rates });
    } catch (error) {
        console.error("Error getting rates:", error);
        res.status(200).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const GetRate = async (req, res) => {
    try {
        const { currency } = req.params;
        const rate = await RateModel.findOne({ currency }).lean();
        if (!rate) {
            return res.status(200).json({
                success: false,
                message: "Rate not found",
            });
        }
        res.status(200).json({ success: true, data: rate });
    } catch (error) {
        console.error("Error getting rate:", error);
        res.status(200).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

export default {
    GetRates,
    GetRate,
    UpdateRate,
};
