import mongoose, { Schema } from "mongoose";

const activeWalletSchema = new Schema({
    balance: {
        type: Number,
        required: [true, "Balance is required"],
        default: 0,
    },
    equity: {
        type: Number,
        required: [true, "Equity is required"],
        default: 0,
    },
    available: {
        type: Number,
        required: [true, "Available is required"],
        default: 0,
    },
    margin: {
        type: Number,
        required: [true, "Margin is required"],
        default: 0,
    },
    marginLevel: {
        type: Number,
        required: [true, "Margin level is required"],
        default: 0,
    },
    pl: {
        type: Number,
        required: [true, "pl is required"],
        default: 0,
    }
});


const ActiveWalletModel = (mongoose.models.activeWallet) || mongoose.model("activeWallet", activeWalletSchema);

export default ActiveWalletModel;