import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true,
    },
    symbol: {
        type: String,
        required: [true, "Symbol is required"],
    },
    type: {
        type: String,
        required: [true, "Type is required (buy/sell)"],
        enum: ["buy", "sell"],
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
    },
    leverage: {
        type: Number,
        required: [true, "Leverage is required"],
    },
    status: {
        type: String,
        required: [true, "Status is required (active/pending/closed)"],
        enum: ["active", "pending", "closed"],
    },
    position: {
        type: String,
        required: [true, "Position is required (open/close)"],
        enum: ["open", "close"],
    },
    openingTime: {
        type: Date,
        required: [true, "Opening time is required"],
    },
    closingTime: {
        type: Date,
    },
    takeProfit: {
        type: Number,
    },
    stopLoss: {
        type: Number,
    },
    trailingStop: {
        type: String,
        default: "Unset",
    },
    realisedPL: {
        type: Number,
    },
    overnightFunding: {
        type: Number,
        default: 0,
    },
    margin: {
        type: Number,
        required: [true, "Margin is required"],
    },
    openingValue: {
        type: Number,
    },
    closingValue: {
        type: Number,
    },
    tradingAccount: {
        type: String,
        required: [true, "Trading account is required (demo/live)"],
        enum: ["demo", "live"],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
});

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default OrderModel;