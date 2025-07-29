// routes/authRoutes.js
const express = require("express");
const { registerUser, loginUser, getCurrentUser } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser); // 注册接口（用于 token 注册后创建账号）
router.post("/login", loginUser);       // 登录
router.get("/me", authMiddleware, getCurrentUser); // 获取当前登录用户信息

module.exports = router;
