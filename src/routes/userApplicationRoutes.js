const express = require("express");
const { body, param } = require("express-validator");
const userApplicationController = require("../controllers/userApplicationController");
const { authenticate } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const submitFormValidation = [
  body("applicationId")
    .isUUID()
    .withMessage("Valid application ID is required"),
  body("formData").isObject().withMessage("Form data must be an object"),
];

const uploadDocumentsValidation = [
  body("applicationId")
    .isUUID()
    .withMessage("Valid application ID is required"),
];

const applicationIdValidation = [
  param("id").isUUID().withMessage("Valid application ID is required"),
];

// Routes
router.get("/", userApplicationController.getUserApplications);
router.get(
  "/:id",
  applicationIdValidation,
  validate,
  userApplicationController.getUserApplication
);
router.post(
  "/submit-form",
  submitFormValidation,
  validate,
  userApplicationController.submitForm
);
router.post(
  "/upload-documents",
  uploadDocumentsValidation,
  validate,
  userApplicationController.uploadDocuments
);
router.put(
  "/:id",
  applicationIdValidation,
  validate,
  userApplicationController.updateUserApplication
);
router.delete(
  "/:id",
  applicationIdValidation,
  validate,
  userApplicationController.deleteUserApplication
);

module.exports = router;
