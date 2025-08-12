// controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const RegisterToken = require("../models/RegisterToken");

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRE || "3h",
  });
};

exports.registerUser = async (req, res) => {
  const { token, username, password } = req.body;

  try {
    const regToken = await RegisterToken.findOne({ token });

    if (!regToken || regToken.used || regToken.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: regToken.email,
      password: hashed,
      role: "employee",
    });

    regToken.used = true;
    await regToken.save();

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid password" });

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    // For employees, also fetch onboarding status
    let onboardingStatus = 'never-submitted';
    if (user.role === 'employee') {
      const OnboardingApplication = require("../models/OnboardingApplication");
      
      // Check and update onboarding status proactively
      try {
        const hrController = require("./hrController");
        await hrController.checkAndUpdateOnboardingStatus(user._id);
      } catch (error) {
        console.log('⚠️ Could not check onboarding status:', error.message);
      }
      
      const application = await OnboardingApplication.findOne({ user: user._id });
      if (application) {
        onboardingStatus = application.status;
      }
    }
    
    const userResponse = {
      ...user.toObject(),
      onboardingStatus: user.role === 'employee' ? onboardingStatus : undefined
    };
    
    res.json({ user: userResponse });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


