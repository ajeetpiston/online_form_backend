const express = require("express");
const { body, param } = require("express-validator");
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));

// Application management validation
const createApplicationValidation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("category")
    .isIn([
      "Government",
      "Education",
      "Healthcare",
      "Finance",
      "Legal",
      "Other",
    ])
    .withMessage("Invalid category"),
  body("redirectUrl").isURL().withMessage("Valid redirect URL is required"),
  body("formFields")
    .isArray({ min: 1 })
    .withMessage("At least one form field is required"),
];

const updateApplicationStatusValidation = [
  body("status")
    .isIn(["pending", "inProgress", "completed", "rejected"])
    .withMessage("Invalid status"),
  body("adminNotes")
    .optional()
    .isString()
    .withMessage("Admin notes must be a string"),
];

// Routes
router.get("/dashboard", adminController.getDashboard);

// Application management
router.get("/applications", adminController.getAllApplications);
router.post(
  "/applications",
  createApplicationValidation,
  validate,
  adminController.createApplication
);
router.put("/applications/:id", adminController.updateApplication);
router.delete("/applications/:id", adminController.deleteApplication);

// User application management
router.get("/user-applications", adminController.getAllUserApplications);
router.get("/user-applications/:id", adminController.getUserApplication);
router.put(
  "/user-applications/:id/status",
  updateApplicationStatusValidation,
  validate,
  adminController.updateApplicationStatus
);

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUser);
router.put("/users/:id/status", adminController.updateUserStatus);

// Analytics
router.get("/analytics/overview", adminController.getAnalyticsOverview);
router.get("/analytics/applications", adminController.getApplicationAnalytics);
router.get("/analytics/payments", adminController.getPaymentAnalytics);

module.exports = router;
