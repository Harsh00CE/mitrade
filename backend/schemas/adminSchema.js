import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export default mongoose.model("Admin", AdminSchema);
