const express = require("express");
const { query } = require("express-validator");
const applicationController = require("../controllers/applicationController");
const { authenticate, optionalAuth } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const router = express.Router();

// Validation rules
const searchValidation = [
  query("q")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),
  query("category")
    .optional()
    .isIn([
      "Government",
      "Education",
      "Healthcare",
      "Finance",
      "Legal",
      "Other",
    ])
    .withMessage("Invalid category"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

// Routes
router.get(
  "/",
  optionalAuth,
  searchValidation,
  validate,
  applicationController.getApplications
);
router.get(
  "/search",
  optionalAuth,
  searchValidation,
  validate,
  applicationController.searchApplications
);
router.get("/categories", applicationController.getCategories);
router.get("/:id", optionalAuth, applicationController.getApplication);

module.exports = router;
