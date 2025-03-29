import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const openOrdersSchema = new Schema(
    {
        orderId: {
            type: String,
            default: uuidv4,
            unique: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["buy", "sell"],
        },
        quantity: {
            type: Number,
            required: true,
            min: 0.0001,
        },
        price: {
            type: Number,
            required: true,
            min: 0.01,
        },
        leverage: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            required: true,
            enum: ["active", "pending"],
            default: "pending",
            index: true,
        },
        position: {
            type: String,
            required: true,
            enum: ["open"],
            default: "open",
        },
        openingTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        takeProfit: {
            type: Number,
            default: null,
        },
        stopLoss: {
            type: Number,
            default: null,
        },
        trailingStop: {
            type: String,
            default: "Unset",
        },
        margin: {
            type: Number,
            required: true,
        },
        openingValue: {
            type: Number,
            required: true,
        },
        tradingAccount: {
            type: String,
            required: true,
            enum: ["demo", "live"],
            index: true,
        },
        overnightFunding: {
            type: Number,
            default: 0,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common query patterns
openOrdersSchema.index({ userId: 1, status: 1 }, { partialFilterExpression: { status: 'active' } });
openOrdersSchema.index({ userId: 1, status: 1 });
openOrdersSchema.index({ userId: 1, symbol: 1 });
openOrdersSchema.index({ symbol: 1, status: 1 });

const OpenOrdersModel = mongoose.models.OpenOrders || mongoose.model("OpenOrders", openOrdersSchema);

export default OpenOrdersModel;