import mongoose, { Schema } from "mongoose";

const demoWalletSchema = new Schema({
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
        default: 50000,
        set: (value) => Number(value.toFixed(3)),
    },
    equity: {
        type: Number,
        required: [true, "Equity is required"],
        default: 50000,
        set: (value) => Number(value.toFixed(3)),
    },
    available: {
        type: Number,
        required: [true, "Available is required"],
        default: 50000,
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
    leverage: {
        type: Number,
        default: 1,
        required: true,
        min: 1,
    },
    pl: {
        type: Number,
        required: [true, "pl is required"],
        default: 0,
        set: (value) => Number(value.toFixed(3)),
    },
});

const DemoWalletModel = mongoose.model("DemoWallet", demoWalletSchema);

export default DemoWalletModel;
