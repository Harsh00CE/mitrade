import mongoose, { Schema } from "mongoose";

const orderHistorySchema = new Schema({
    orderId: {
        type: String,
        required: [true, "Order ID is required"],
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
        required: [true, "Status is required (closed)"],
        enum: ["closed"],
    },
    position: {
        type: String,
        required: [true, "Position is required (close)"],
        enum: ["close"],
    },
    openingTime: {
        type: Date,
        required: [true, "Opening time is required"],
    },
    closingTime: {
        type: Date,
        required: [true, "Closing time is required"],
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
        required: [true, "Realised PL is required"],
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
        required: [true, "Opening value is required"],
    },
    closingValue: {
        type: Number,
        required: [true, "Closing value is required"],
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
    } 
});

const OrderHistoryModel = mongoose.models.OrderHistory || mongoose.model("OrderHistory", orderHistorySchema);

export default OrderHistoryModel;