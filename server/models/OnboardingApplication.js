// models/OnboardingApplication.js
const mongoose = require("mongoose");

const OnboardingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  personalInfo: {
    name: {
      firstName: String,
      lastName: String,
      middleName: String,
      preferredName: String,
    },
    profilePicture: String, // URL to uploaded profile picture
    address: {
      building: String,
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    contact: {
      phone: String,
      workPhone: String,
    },
    ssn: String,
    dob: Date,
    gender: String,
    visa: {
      isUSCitizen: Boolean,
      visaTitle: String,
      startDate: Date,
      endDate: Date,
      optReceipt: String,
    },
    reference: {
      firstName: String,
      lastName: String,
      middleName: String,
      phone: String,
      email: String,
      relationship: String,
    },
    emergencyContacts: [
      {
        firstName: String,
        lastName: String,
        middleName: String,
        phone: String,
        email: String,
        relationship: String,
      },
    ],
  },
  documents: [String], // 存文件路径
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  feedback: String,
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OnboardingApplication", OnboardingSchema);
