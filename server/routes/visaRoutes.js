const express = require("express");
const router = express.Router();
const { getVisaSteps, uploadVisaDoc } = require("../controllers/visaController");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", authMiddleware, getVisaSteps);
router.post("/upload", authMiddleware, upload.single("file"), uploadVisaDoc);

module.exports = router;