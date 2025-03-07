import mongoose, { Schema } from "mongoose";

const demoWalletSchema = new Schema({
  balance: {
    type: Number,
    required: [true, "Balance is required"],
    default: 50000,
  },
  equity: {
    type: Number,
    required: [true, "Equity is required"],
    default: 0,
  },
  available: {
    type: Number,
    required: [true, "Available is required"],
    default: 0,
  },
  margin: {
    type: Number,
    required: [true, "Margin is required"],
    default: 0,
  },
  marginLevel: {
    type: Number,
    required: [true, "Margin level is required"],
    default: 0,
  },
  pl: {
    type: Number,
    required: [true, "pl is required"],
    default: 0,
  },
});

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
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  orderId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Order",
  },
  demoWallet: demoWalletSchema, 
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const DemoWalletModel = mongoose.models.demoWallet || mongoose.model("demoWallet", demoWalletSchema);

export { UserModel, DemoWalletModel };