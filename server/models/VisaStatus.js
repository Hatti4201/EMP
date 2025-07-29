// models/VisaStatus.js
const mongoose = require("mongoose");

const visaStepSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["OPT Receipt", "OPT EAD", "I-983", "I-20"],
    required: true,
  },
  file: String,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  feedback: String,
  uploadedAt: Date,
});

const visaStatusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  steps: [visaStepSchema],
});

module.exports = mongoose.model("VisaStatus", visaStatusSchema);
