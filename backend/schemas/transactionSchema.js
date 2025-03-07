import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["deposit", "withdrawal", "realizedPL", "adjustment"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const TransactionModel = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default TransactionModel;