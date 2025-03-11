import mongoose, { Schema } from "mongoose";

const pairInfoSchema = new Schema({
    symbol: {
        type: String,
        required: [true, "Symbol is required"],
    },
    volumePerTrade: {
        type: Number,
        required: [true, "Volume per trade is required"],
    },
    maxLeverage: [{
        type: Number,
        required: [true, "Max leverage is required"],
    }],
    ContractSize: {
        type: Number,
        required: [true, "Contract size is required"],
    },
    maxVolumeOfOpenPosition: {
        type: Number,
        required: [true, "Max volume of open position is required"],
    },
    CurrencyOfQuote: {
        type: String,
        required: [true, "Currency of quote is required"],
    },
    floatingSpread: {
        type: Number,
        required: [true, "Floating spread is required"],
    },
    OvernightFundingRateBuy: {
        type: Number,
        required: [true, "Overnight funding rate is required"],
    },
    OvernightFundingRateSell: {
        type: Number,
        required: [true, "Overnight funding rate is required"],
    },
    OvernightFundingRateTime: {
        type: Number,
        required: [true, "Overnight funding rate is required"],
    },
});

const PairInfoModel = (mongoose.models.pairInfo) || mongoose.model("pairInfo", pairInfoSchema);

export default PairInfoModel;