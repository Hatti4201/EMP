const express = require("express");
const router = express.Router();
const { generateRegisterToken } = require("../controllers/hrController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

router.post("/token", authMiddleware, requireRole("hr"), generateRegisterToken);
// 添加新的文档审批接口
const { approveVisaDoc } = require("../controllers/documentApprovalController");
router.put("/document/:employeeId", authMiddleware, requireRole("hr"), approveVisaDoc);


module.exports = router;