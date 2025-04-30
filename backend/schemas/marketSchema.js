import mongoose from "mongoose";

const MarketSchema = new mongoose.Schema({
  isMarketOn: {
    type: Boolean,
    default: false
  },
  nextScheduledClose: {
    type: Date,
    default: null
  },
  nextScheduledReopen: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  closeReason: {
    type: String,
    default: ""
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  marketType: {
    type: String,
    enum: ["Forex", "Crypto", "Forex-Crypto"],
    default: ""
  }
});


export default mongoose.model("Market", MarketSchema);