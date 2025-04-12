import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    amountType:{
        type: String,
        enum: ['USD', 'INR'],
        required: true
    },
    documentImage: {
        type: String,
        default: '',
        required: true
    },
    utr:{
        type: String,
        default: '',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true 
});

const DepositModel = mongoose.model('Deposit', depositSchema);

export default DepositModel;
