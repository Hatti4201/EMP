const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

module.exports = mongoose.model("RegisterToken", tokenSchema);