const { Op } = require("sequelize");
const {
  UserApplication,
  Application,
  Payment,
  Document,
  User,
} = require("../models");
const { sendEmail } = require("../utils/emailService");
const { AppError } = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const logger = require("../utils/logger");

// Get user applications with pagination
exports.getUserApplications = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = "submittedAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const where = { userId: req.user.id };

  // Add status filter
  if (status) {
    where.status = status;
  }

  const { count, rows: userApplications } =
    await UserApplication.findAndCountAll({
      where,
      include: [
        {
          model: Application,
          as: "application",
          attributes: ["id", "title", "category", "imageUrl", "processingFee"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["id", "amount", "status", "paidAt"],
        },
        {
          model: Document,
          as: "documents",
          attributes: [
            "id",
            "fileName",
            "originalName",
            "fileUrl",
            "isVerified",
          ],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      applications: userApplications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

// Get single user application
exports.getUserApplication = catchAsync(async (req, res) => {
  const { id } = req.params;

  const userApplication = await UserApplication.findOne({
    where: { id, userId: req.user.id },
    include: [
      {
        model: Application,
        as: "application",
        include: [
          {
            model: require("../models").FormField,
            as: "formFields",
            order: [["order", "ASC"]],
          },
        ],
      },
      {
        model: Payment,
        as: "payment",
      },
      {
        model: Document,
        as: "documents",
      },
    ],
  });

  if (!userApplication) {
    throw new AppError("Application not found", 404);
  }

  res.json({
    success: true,
    data: { application: userApplication },
  });
});

// Submit form application
exports.submitForm = catchAsync(async (req, res) => {
  const { applicationId, formData } = req.body;
  const userId = req.user.id;

  // Check if application exists and is active
  const application = await Application.findOne({
    where: { id: applicationId, isActive: true },
  });

  if (!application) {
    throw new AppError("Application not found or inactive", 404);
  }

  // Check if user already submitted this application
  const existingSubmission = await UserApplication.findOne({
    where: { userId, applicationId },
  });

  if (existingSubmission) {
    throw new AppError("You have already submitted this application", 400);
  }

  // Create user application
  const userApplication = await UserApplication.create({
    userId,
    applicationId,
    submissionType: "form",
    formData,
    status: "pending",
  });

  // Load the created application with relations
  const createdApplication = await UserApplication.findByPk(
    userApplication.id,
    {
      include: [
        {
          model: Application,
          as: "application",
        },
        {
          model: User,
          as: "user",
        },
      ],
    }
  );

  // Send confirmation email
  try {
    await sendEmail({
      to: req.user.email,
      template: "applicationSubmitted",
      data: {
        userName: req.user.name,
        applicationTitle: application.title,
        trackingNumber: createdApplication.trackingNumber,
        submissionType: "Form Submission",
        status: "Pending",
        submittedAt: createdApplication.submittedAt.toLocaleDateString(),
      },
    });
  } catch (error) {
    logger.error("Failed to send application confirmation email:", error);
  }

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: { application: createdApplication },
  });
});

// Upload documents for application
exports.uploadDocuments = catchAsync(async (req, res) => {
  const { applicationId } = req.body;
  const userId = req.user.id;

  // Check if application exists and allows document upload
  const application = await Application.findOne({
    where: { id: applicationId, isActive: true, allowDocumentUpload: true },
  });

  if (!application) {
    throw new AppError(
      "Application not found or does not allow document upload",
      404
    );
  }

  // Check if user already submitted this application
  const existingSubmission = await UserApplication.findOne({
    where: { userId, applicationId },
  });

  if (existingSubmission) {
    throw new AppError("You have already submitted this application", 400);
  }

  // Create user application (documents will be uploaded separately via file upload endpoint)
  const userApplication = await UserApplication.create({
    userId,
    applicationId,
    submissionType: "document",
    status: "pending",
    amountPaid: application.processingFee,
  });

  res.status(201).json({
    success: true,
    message:
      "Document application created. Please upload your documents and complete payment.",
    data: {
      application: userApplication,
      processingFee: application.processingFee,
      requiresPayment: !!application.processingFee,
    },
  });
});

// Update user application (for editing pending applications)
exports.updateUserApplication = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { formData } = req.body;
  const userId = req.user.id;

  const userApplication = await UserApplication.findOne({
    where: { id, userId, status: "pending" },
  });

  if (!userApplication) {
    throw new AppError("Application not found or cannot be edited", 404);
  }

  // Only allow updating form data for form submissions
  if (userApplication.submissionType === "form" && formData) {
    await userApplication.update({ formData });
  }

  const updatedApplication = await UserApplication.findByPk(id, {
    include: [
      {
        model: Application,
        as: "application",
      },
    ],
  });

  res.json({
    success: true,
    message: "Application updated successfully",
    data: { application: updatedApplication },
  });
});

// Delete user application (only pending applications)
exports.deleteUserApplication = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const userApplication = await UserApplication.findOne({
    where: { id, userId, status: "pending" },
  });

  if (!userApplication) {
    throw new AppError("Application not found or cannot be deleted", 404);
  }

  await userApplication.destroy();

  res.json({
    success: true,
    message: "Application deleted successfully",
  });
});
