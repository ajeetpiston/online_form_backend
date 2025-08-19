const Razorpay = require("razorpay");
const crypto = require("crypto");
const { Payment, UserApplication, Application, User } = require("../models");
const { AppError } = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const logger = require("../utils/logger");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
exports.createOrder = catchAsync(async (req, res) => {
  const { userApplicationId, amount, currency = "INR" } = req.body;
  const userId = req.user.id;

  // Verify user application exists and belongs to user
  const userApplication = await UserApplication.findOne({
    where: { id: userApplicationId, userId },
    include: [
      {
        model: Application,
        as: "application",
      },
    ],
  });

  if (!userApplication) {
    throw new AppError("User application not found", 404);
  }

  // Check if payment already exists for this application
  const existingPayment = await Payment.findOne({
    where: { userId, status: "completed" },
    include: [
      {
        model: UserApplication,
        as: "applications",
        where: { id: userApplicationId },
      },
    ],
  });

  if (existingPayment) {
    throw new AppError("Payment already completed for this application", 400);
  }

  try {
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `receipt_${userApplicationId}_${Date.now()}`,
      notes: {
        userApplicationId,
        applicationTitle: userApplication.application.title,
      },
    });

    // Create payment record
    const payment = await Payment.create({
      userId,
      amount,
      currency,
      status: "pending",
      paymentGateway: "razorpay",
      gatewayOrderId: razorpayOrder.id,
      description: `Payment for ${userApplication.application.title}`,
      metadata: {
        userApplicationId,
        razorpayOrderId: razorpayOrder.id,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        payment,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    logger.error("Failed to create Razorpay order:", error);
    throw new AppError("Failed to create payment order", 500);
  }
});

// Verify payment
exports.verifyPayment = catchAsync(async (req, res) => {
  const { paymentId, gatewayPaymentId, gatewayOrderId, signature } = req.body;
  const userId = req.user.id;

  // Find payment record
  const payment = await Payment.findOne({
    where: { id: paymentId, userId, status: "pending" },
  });

  if (!payment) {
    throw new AppError("Payment not found or already processed", 404);
  }

  // Verify Razorpay signature
  const body = gatewayOrderId + "|" + gatewayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new AppError("Invalid payment signature", 400);
  }

  try {
    // Verify payment with Razorpay
    const razorpayPayment = await razorpay.payments.fetch(gatewayPaymentId);

    if (razorpayPayment.status === "captured") {
      // Update payment status
      await payment.update({
        status: "completed",
        gatewayPaymentId,
        gatewaySignature: signature,
        paidAt: new Date(),
      });

      // Update user application with payment info
      const userApplicationId = payment.metadata.userApplicationId;
      if (userApplicationId) {
        await UserApplication.update(
          {
            paymentId: payment.id,
            amountPaid: payment.amount,
          },
          { where: { id: userApplicationId } }
        );
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        data: { payment },
      });
    } else {
      throw new AppError("Payment not captured", 400);
    }
  } catch (error) {
    logger.error("Payment verification failed:", error);

    // Update payment status to failed
    await payment.update({ status: "failed" });

    throw new AppError("Payment verification failed", 400);
  }
});

// Get payment history
exports.getPaymentHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;
  const where = { userId: req.user.id };

  if (status) {
    where.status = status;
  }

  const { count, rows: payments } = await Payment.findAndCountAll({
    where,
    include: [
      {
        model: UserApplication,
        as: "applications",
        include: [
          {
            model: Application,
            as: "application",
            attributes: ["id", "title", "category"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

// Get single payment
exports.getPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const payment = await Payment.findOne({
    where: { id, userId },
    include: [
      {
        model: UserApplication,
        as: "applications",
        include: [
          {
            model: Application,
            as: "application",
          },
        ],
      },
    ],
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  res.json({
    success: true,
    data: { payment },
  });
});
