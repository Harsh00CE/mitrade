import mongoose from "mongoose";


const adminAccountDetailsSchema = new mongoose.Schema({
    accountNumber: {
        type: Number,
        required: true
    },
    holderName: {
        type: String,
        required: true
    },
    IFSCcode: {
        type: String,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    usdtAddress: {
        type: String,
    },
    usdtType: {
        type: String,
    },
    qrCodeImage: {
        type: String, 
    }
    
})

const AdminAccountDetails = mongoose.model('AdminAccountDetails', adminAccountDetailsSchema);

export default AdminAccountDetails;