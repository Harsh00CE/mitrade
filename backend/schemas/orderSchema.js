import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({
    orderId: {
        type: String,
        required: [true, "Order ID is required"],
        unique: true,
    },
    symbol: {
        type: String,
        required: [true, "Symbol is required"],
    },
    status:{
        type:String,
        require:[true , "Set status active/pending/closed"]
    },
    position:{
        type:String,
        require:[true , "Set position open/close"]
    },
    openingTime: {
        type: Date,
        required: [true, "Opening time is required"],
    },
    closingTime: {
        type: Date,
        required: [true, "Closing time is required"],
    },
    closingReason: {
        type: String,
        required: [true, "Closing reason is required"],
    },
    takeProfit: {
        type: Number,
        required: [true, "Take profit is required"],
    },
    stopLoss: {
        type: Number,
        required: [true, "Stop loss is required"],
    },
    trailingStop: {
        type: String,
        default: "Unset",
    },
    realisedPL: {
        type: Number,
        required: [true, "Realised P/L is required"],
    },
    overnightFunding: {
        type: Number,
        default: 0,
    },
    margin: {
        type: Number,
        required: [true, "Margin is required"],
    },
    m_margin:{
        type: Number,
        required: [true, "Min Margin is required"],
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
        required: [true, "Trading account is required"],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
});

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default OrderModel;