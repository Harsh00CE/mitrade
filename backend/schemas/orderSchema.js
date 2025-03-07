import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({
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
    },
    closingReason: {
        type: String,
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
    m_margin:{
        type: Number,
    },
    openingValue: {
        type: Number,
        // required: [true, "Opening value is required"],
    },
    closingValue: {
        type: Number,
    },
    tradingAccount: {
        type: String,
        // required: [true, "Trading account is required"],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default OrderModel;