const express = require("express");
const { body } = require("express-validator");
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createOrderValidation = [
  body("userApplicationId")
    .isUUID()
    .withMessage("Valid user application ID is required"),
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("currency")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be INR or USD"),
];

const verifyPaymentValidation = [
  body("paymentId").isUUID().withMessage("Valid payment ID is required"),
  body("gatewayPaymentId")
    .notEmpty()
    .withMessage("Gateway payment ID is required"),
  body("gatewayOrderId").notEmpty().withMessage("Gateway order ID is required"),
  body("signature").notEmpty().withMessage("Payment signature is required"),
];

// Routes
router.post(
  "/create-order",
  createOrderValidation,
  validate,
  paymentController.createOrder
);
router.post(
  "/verify",
  verifyPaymentValidation,
  validate,
  paymentController.verifyPayment
);
router.get("/history", paymentController.getPaymentHistory);
router.get("/:id", paymentController.getPayment);

module.exports = router;
