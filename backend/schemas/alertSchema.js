import mongoose, { Schema } from "mongoose";

const alertSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
    symbol: {
        type: String,
        required: [true, "Symbol is required"],
    },
    alertPrice: {
        type: Number,
        required: [true, "Alert price is required"],
    },
    alertType: {
        type: String,
        required: [true, "Alert type is required (buy/sell)"],
        enum: ["buy", "sell"], 
    },
    frequency: {
        type: String,
        required: [true, "Frequency is required (onlyOnce/onceADay)"],
        enum: ["onlyOnce", "onceADay"],
    },
    triggered: {
        type: Boolean,
        default: false,
    },
    lastTriggered: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const AlertModel = mongoose.models.Alert || mongoose.model("Alert", alertSchema);

export default AlertModel;