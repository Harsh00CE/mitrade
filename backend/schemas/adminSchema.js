import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const AdminSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  isMarketOn: { 
    type: Boolean, 
    default: false 
  },
  nextScheduledClose: {  
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


export default mongoose.model("Admin", AdminSchema);