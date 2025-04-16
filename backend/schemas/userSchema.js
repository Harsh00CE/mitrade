import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
  },
  verifyCode: {
    type: String,
    required: [true, "Verify code is required"],
    default: null,
    unique: true,
  },
  verifyCodeExpires: {
    type: Date,
    required: [true, "Verify code expires is required"],
    index: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  walletType:{
    type: String,
    enum: ["demo", "active"],
    default: "demo",
  },
  demoWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DemoWallet",
  },
  activeWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ActiveWallet",
  },
  orderList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  favoriteTokens: {
    type: [String],
    default: [],
  },
  alerts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
    },
  ],
  kyc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BasicKYC",
  },
  orderHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderHistory",
    },
  ],
});


const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

export default UserModel;
