const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  goal: { type: String, required: true }, // stored as Wei string to preserve precision
  deadline: { type: Date, required: true },
  // blockchainId is unique but sparse to allow multiple null values
  // This allows campaigns to be created via API before being deployed to blockchain
  blockchainId: { type: Number, unique: true, sparse: true },
  creator: { type: String }, // wallet address
  amountRaised: { type: String, default: "0" }, // stored as Wei string
  finalized: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Campaign", campaignSchema);
