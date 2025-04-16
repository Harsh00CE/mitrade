import mongoose, { Schema } from "mongoose";

const pairInfoSchema = new Schema({
    symbol: {
        type: String,
        required: [true, "Symbol is required"],
    },
    pairType: {
        type: String,
        // required: [true, "Pair type is required"],
    },
    volumePerTrade: {
        min: {
            type: Number,
            required: [true, "Minimum volume per trade is required"],
        },
        max: {
            type: Number,
            required: [true, "Maximum volume per trade is required"],
        },
    },
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
        required: [true, "Overnight funding rate (buy) is required"],
    },
    OvernightFundingRateSell: {
        type: Number,
        required: [true, "Overnight funding rate (sell) is required"],
    },
    OvernightFundingRateTime: {
        type: String,
        required: [true, "Overnight funding rate time is required"],
    },
    logo: {
        type: String,
        default: '',
    }

});

const PairInfoModel = mongoose.models.PairInfo || mongoose.model("PairInfo", pairInfoSchema);

export default PairInfoModel;