// controllers/onboardingController.js
const Onboarding = require("../models/OnboardingApplication");

exports.submitApplication = async (req, res) => {
  const userId = req.user.id;
  try {
    const exists = await Onboarding.findOne({ user: userId });
    if (exists) return res.status(400).json({ message: "Already submitted" });

    const newApp = await Onboarding.create({
      user: userId,
      personalInfo: req.body.personalInfo,
      documents: req.body.documents,
    });

    res.status(201).json({ status: newApp.status });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getApplicationStatus = async (req, res) => {
  try {
    const application = await Onboarding.findOne({ user: req.user.id });
    if (!application) return res.status(404).json({ message: "Not submitted" });

    res.json({ status: application.status, feedback: application.feedback });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const updated = await Onboarding.findOneAndUpdate(
      { user: req.user.id },
      { personalInfo: req.body.updatedInfo, status: "pending", feedback: "" },
      { new: true }
    );
    res.json({ message: "Application updated", status: updated.status });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};
