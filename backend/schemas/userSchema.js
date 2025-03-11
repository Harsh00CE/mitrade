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
  demoWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "demoWallet",
    required: [true, "Demo wallet is required"],
  },
  orderList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order", 
  }],
  favoriteTokens: {
    type: [String], 
    default: [], 
  },
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

export default UserModel 