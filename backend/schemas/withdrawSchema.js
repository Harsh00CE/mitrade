import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    accountNumber: {
        type: Number,
        required: true
    },
    IFSCcode: {
        type: String,
        required: true
    },
    amountType: {
        type: String,
        enum: ['USD', 'INR'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    holderName: {
        type: String,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
}, {
    timestamps: true
});

const WithdrawModel = mongoose.model('Withdraw', withdrawSchema);

export default WithdrawModel;