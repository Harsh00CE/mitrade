import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const orderSchema = new Schema(
    {
        orderId: {
            type: String,
            default: uuidv4,
            unique: true,
            index: true, // ✅ Speeds up searches using orderId
        },
        symbol: {
            type: String,
            required: true,
            index: true, // ✅ Common filter, so indexing helps
        },
        type: {
            type: String,
            required: true,
            enum: ["buy", "sell"],
        },
        quantity: {
            type: Number,
            required: true,
            min: 0.0001, // ✅ Prevents invalid values
        },
        price: {
            type: Number,
            required: true,
            min: 0.01, // ✅ Avoids zero-price errors
        },
        leverage: {
            type: Number,
            required: true,
            min: 1, // ✅ Ensures valid leverage
        },
        status: {
            type: String,
            required: true,
            enum: ["active", "pending", "closed"],
            index: true, // ✅ Frequently filtered field
        },
        position: {
            type: String,
            required: true,
            enum: ["open", "close"],
            index: true, // ✅ Optimizes queries by position
        },
        openingTime: {
            type: Date,
            required: true,
        },
        closingTime: {
            type: Date,
            default: null,
        },
        takeProfit: {
            type: Number,
            default: null,
        },
        stoploss: {
            type: Number,
            default: null,
        },
        trailingStop: {
            type: String,
            default: "Unset",
        },
        realisedPL: {
            type: Number,
            default: 0,
        },
        overnightFunding: {
            type: Number,
            default: 0,
        },
        margin: {
            type: Number,
            required: true,
        },
        openingValue: Number,
        closingValue: Number,
        tradingAccount: {
            type: String,
            required: true,
            enum: ["demo", "active"],
            index: true, 
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

orderSchema.index({ userId: 1, status: 1, position: 1 });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default OrderModel;
