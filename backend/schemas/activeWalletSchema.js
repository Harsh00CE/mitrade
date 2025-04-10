import mongoose, { Schema } from "mongoose";

const activeWalletSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
        required: true,
        index: true,
    },
    balance: {
        type: Number,
        required: [true, "Balance is required"],
        default: 0,
        set: (value) => Number(value.toFixed(3)),
    },
    equity: {
        type: Number,
        required: [true, "Equity is required"],
        default: 0,
        set: (value) => Number(value.toFixed(3)),
    },
    available: {
        type: Number,
        required: [true, "Available is required"],
        default: 0,
        set: (value) => Number(value.toFixed(3)),
    },
    margin: {
        type: Number,
        required: [true, "Margin is required"],
        default: 0,
        set: (value) => Number(value.toFixed(3)),
    },
    marginLevel: {
        type: Number,
        required: [true, "Margin level is required"],
        default: 0,
        set: (value) => Number(value.toFixed(3)),
    },
    pl: {
        type: Number,
        required: [true, "pl is required"],
        default: 0,
        set: (value) => Number(value.toFixed(3)),
    },
});

const ActiveWalletModel = mongoose.model("activeWallet", activeWalletSchema);

export default ActiveWalletModel;