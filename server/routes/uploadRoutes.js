const express = require("express");
const router = express.Router();
const { uploadFile } = require("../controllers/uploadController");
const upload = require("../middleware/uploadMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");
const path = require("path");
const fs = require("fs");

// 上传文件（需要登录）
router.post("/", authMiddleware, upload.single("file"), uploadFile);

// 预览 / 下载文件
router.get("/:filename", (req, res) => {
  const filePath = path.join(__dirname, "..", "uploads", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  res.sendFile(filePath);
});

module.exports = router;