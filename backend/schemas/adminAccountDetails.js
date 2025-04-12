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
})

const AdminAccountDetails = mongoose.model('AdminAccountDetails', adminAccountDetailsSchema);

export default AdminAccountDetails;