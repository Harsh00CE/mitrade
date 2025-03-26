import mongoose, { Schema } from "mongoose";

const setFixedDecimal = (value) => Number(value.toFixed(3));

const activeWalletSchema = new Schema({
    balance: {
        type: Number,
        required: [true, "Balance is required"],
        default: 50000,
        set: setFixedDecimal,
    },
    equity: {
        type: Number,
        required: [true, "Equity is required"],
        default: 0,
        set: setFixedDecimal,
    },
    available: {
        type: Number,
        required: [true, "Available is required"],
        default: 0,
        set: setFixedDecimal,
    },
    margin: {
        type: Number,
        required: [true, "Margin is required"],
        default: 0,
        set: setFixedDecimal,
    },
    marginLevel: {
        type: Number,
        required: [true, "Margin level is required"],
        default: 0,
        set: setFixedDecimal,
    },
    pl: {
        type: Number,
        required: [true, "pl is required"],
        default: 0,
        set: setFixedDecimal,
    },
}, {
    timestamps: true,
});

const ActiveWalletModel = mongoose.models.activeWallet || mongoose.model("activeWallet", activeWalletSchema);

export default ActiveWalletModel;