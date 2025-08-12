const express = require("express");
const router = express.Router();
const { 
  generateRegisterToken, 
  getAllRegistrationTokens, 
  testEmailConfig,
  getAllEmployees,
  getEmployeeById,
  getDashboardStats,
  getPendingApplications,
  reviewVisaDocument,
  sendNotificationEmail,
  triggerOnboardingStatusCheck
} = require("../controllers/hrController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// Dashboard and Statistics
router.get("/dashboard/stats", authMiddleware, requireRole("hr"), getDashboardStats);

// Employee Management
router.get("/employees", authMiddleware, requireRole("hr"), getAllEmployees);
router.get("/employees/:id", authMiddleware, requireRole("hr"), getEmployeeById);

// Application Management
router.get("/applications", authMiddleware, requireRole("hr"), getPendingApplications);

// Registration Token Management
router.post("/token", authMiddleware, requireRole("hr"), generateRegisterToken);
router.get("/tokens", authMiddleware, requireRole("hr"), getAllRegistrationTokens);

// Email Configuration
router.get("/test-email", authMiddleware, requireRole("hr"), testEmailConfig);

// Document Approval
const { approveVisaDoc } = require("../controllers/documentApprovalController");
router.put("/document/:employeeId", authMiddleware, requireRole("hr"), approveVisaDoc);

// Visa Document Review
router.post("/review-visa-document", authMiddleware, requireRole("hr"), reviewVisaDocument);

// Notification Emails
router.post("/send-notification", authMiddleware, requireRole("hr"), sendNotificationEmail);

// Onboarding Status Check
router.post("/check-onboarding-status/:employeeId", authMiddleware, requireRole("hr"), triggerOnboardingStatusCheck);

module.exports = router;