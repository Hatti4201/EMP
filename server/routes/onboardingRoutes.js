// routes/onboardingRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitApplication,
  getApplicationStatus,
  updateApplication,
} = require("../controllers/onboardingController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, submitApplication);      // 提交申请
router.get("/me", authMiddleware, getApplicationStatus);  // 查看状态
router.put("/", authMiddleware, updateApplication);       // 编辑申请

module.exports = router;
