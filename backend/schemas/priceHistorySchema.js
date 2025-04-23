// schemas/priceHistorySchema.js
import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema({
    symbol: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    type: { type: String, enum: ['forex', 'crypto'], required: true }
}, { timestamps: true });

export default mongoose.model('PriceHistory', priceHistorySchema);