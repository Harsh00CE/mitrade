import mongoose from "mongoose";

const rateSchema = new mongoose.Schema(
    {
        currency: {
            type: String,
            required: true,
            unique: true,
        },
        rate: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

export default mongoose.model("Rate", rateSchema);
