const { Op, fn, col, literal } = require("sequelize");
const {
  User,
  Application,
  FormField,
  UserApplication,
  Payment,
  Document,
} = require("../models");
const { sendEmail } = require("../utils/emailService");
const { AppError } = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const logger = require("../utils/logger");

// Get admin dashboard data
exports.getDashboard = catchAsync(async (req, res) => {
  const today = new Date();
  const lastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    today.getDate()
  );

  // Get counts
  const [
    totalUsers,
    totalApplications,
    totalSubmissions,
    pendingSubmissions,
    completedSubmissions,
    totalRevenue,
    newUsersThisMonth,
    submissionsThisMonth,
  ] = await Promise.all([
    User.count({ where: { role: "user" } }),
    Application.count({ where: { isActive: true } }),
    UserApplication.count(),
    UserApplication.count({ where: { status: "pending" } }),
    UserApplication.count({ where: { status: "completed" } }),
    Payment.sum("amount", { where: { status: "completed" } }),
    User.count({ where: { role: "user", createdAt: { [Op.gte]: lastMonth } } }),
    UserApplication.count({ where: { createdAt: { [Op.gte]: lastMonth } } }),
  ]);

  // Get recent submissions
  const recentSubmissions = await UserApplication.findAll({
    limit: 10,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
      {
        model: Application,
        as: "application",
        attributes: ["id", "title", "category"],
      },
    ],
  });

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalApplications,
        totalSubmissions,
        pendingSubmissions,
        completedSubmissions,
        totalRevenue: totalRevenue || 0,
        newUsersThisMonth,
        submissionsThisMonth,
      },
      recentSubmissions,
    },
  });
});

// Get all applications (admin view)
exports.getAllApplications = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    isActive,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const { count, rows: applications } = await Application.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "name", "email"],
      },
      {
        model: FormField,
        as: "formFields",
        attributes: ["id", "label", "fieldType", "isRequired"],
      },
    ],
    order: [[sortBy, sortOrder.toUpperCase()]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

// Create new application
exports.createApplication = catchAsync(async (req, res) => {
  const {
    title,
    description,
    category,
    imageUrl,
    tutorialUrl,
    redirectUrl,
    allowDocumentUpload,
    processingFee,
    estimatedTime,
    priority,
    tags,
    requirements,
    formFields,
  } = req.body;

  const createdBy = req.user.id;

  // Create application
  const application = await Application.create({
    title,
    description,
    category,
    imageUrl,
    tutorialUrl,
    redirectUrl,
    allowDocumentUpload,
    processingFee,
    estimatedTime,
    priority,
    tags,
    requirements,
    createdBy,
  });

  // Create form fields
  if (formFields && formFields.length > 0) {
    const fieldsWithApplicationId = formFields.map((field, index) => ({
      ...field,
      applicationId: application.id,
      order: field.order || index,
    }));

    await FormField.bulkCreate(fieldsWithApplicationId);
  }

  // Fetch created application with form fields
  const createdApplication = await Application.findByPk(application.id, {
    include: [
      {
        model: FormField,
        as: "formFields",
        order: [["order", "ASC"]],
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: "Application created successfully",
    data: { application: createdApplication },
  });
});

// Update application
exports.updateApplication = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const application = await Application.findByPk(id);
  if (!application) {
    throw new AppError("Application not found", 404);
  }

  await application.update(updateData);

  const updatedApplication = await Application.findByPk(id, {
    include: [
      {
        model: FormField,
        as: "formFields",
        order: [["order", "ASC"]],
      },
    ],
  });

  res.json({
    success: true,
    message: "Application updated successfully",
    data: { application: updatedApplication },
  });
});

// Delete application
exports.deleteApplication = catchAsync(async (req, res) => {
  const { id } = req.params;

  const application = await Application.findByPk(id);
  if (!application) {
    throw new AppError("Application not found", 404);
  }

  // Soft delete by setting isActive to false
  await application.update({ isActive: false });

  res.json({
    success: true,
    message: "Application deleted successfully",
  });
});

// Get all user applications (admin view)
exports.getAllUserApplications = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    submissionType,
    sortBy = "submittedAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (submissionType) where.submissionType = submissionType;

  const { count, rows: userApplications } =
    await UserApplication.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Application,
          as: "application",
          attributes: ["id", "title", "category", "processingFee"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["id", "amount", "status", "paidAt"],
        },
        {
          model: Document,
          as: "documents",
          attributes: ["id", "fileName", "originalName", "isVerified"],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

  res.json({
    success: true,
    data: {
      applications: userApplications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

// Get single user application (admin view)
exports.getUserApplication = catchAsync(async (req, res) => {
  const { id } = req.params;

  const userApplication = await UserApplication.findByPk(id, {
    include: [
      {
        model: User,
        as: "user",
      },
      {
        model: Application,
        as: "application",
        include: [
          {
            model: FormField,
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
    throw new AppError("User application not found", 404);
  }

  res.json({
    success: true,
    data: { application: userApplication },
  });
});

// Update application status
exports.updateApplicationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes, rejectionReason } = req.body;

  const userApplication = await UserApplication.findByPk(id, {
    include: [
      {
        model: User,
        as: "user",
      },
      {
        model: Application,
        as: "application",
      },
    ],
  });

  if (!userApplication) {
    throw new AppError("User application not found", 404);
  }

  const updateData = { status, adminNotes };

  if (status === "completed") {
    updateData.completedAt = new Date();
  } else if (status === "rejected") {
    updateData.rejectedAt = new Date();
    updateData.rejectionReason = rejectionReason;
  }

  await userApplication.update(updateData);

  // Send status update email
  try {
    const statusColors = {
      pending: "#F59E0B",
      inProgress: "#3B82F6",
      completed: "#10B981",
      rejected: "#EF4444",
    };

    await sendEmail({
      to: userApplication.user.email,
      template: "applicationStatusUpdate",
      data: {
        userName: userApplication.user.name,
        applicationTitle: userApplication.application.title,
        trackingNumber: userApplication.trackingNumber,
        status: status.charAt(0).toUpperCase() + status.slice(1),
        statusColor: statusColors[status],
        adminNotes,
      },
    });
  } catch (error) {
    logger.error("Failed to send status update email:", error);
  }

  res.json({
    success: true,
    message: "Application status updated successfully",
    data: { application: userApplication },
  });
});

// Get all users (admin view)
exports.getAllUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const { count, rows: users } = await User.findAndCountAll({
    where,
    attributes: {
      exclude: ["password", "emailVerificationToken", "passwordResetToken"],
    },
    order: [[sortBy, sortOrder.toUpperCase()]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

// Get single user (admin view)
exports.getUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: {
      exclude: ["password", "emailVerificationToken", "passwordResetToken"],
    },
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
      {
        model: Payment,
        as: "payments",
        attributes: ["id", "amount", "status", "paidAt"],
      },
    ],
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    data: { user },
  });
});

// Update user status
exports.updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await user.update({ isActive });

  res.json({
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    data: { user },
  });
});

// Get analytics overview
exports.getAnalyticsOverview = catchAsync(async (req, res) => {
  const { period = "30" } = req.query;
  const days = parseInt(period);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [userGrowth, submissionTrends, categoryStats, statusDistribution] =
    await Promise.all([
      // User growth over time
      User.findAll({
        attributes: [
          [fn("DATE", col("createdAt")), "date"],
          [fn("COUNT", col("id")), "count"],
        ],
        where: {
          createdAt: { [Op.gte]: startDate },
          role: "user",
        },
        group: [fn("DATE", col("createdAt"))],
        order: [[fn("DATE", col("createdAt")), "ASC"]],
        raw: true,
      }),

      // Submission trends
      UserApplication.findAll({
        attributes: [
          [fn("DATE", col("submittedAt")), "date"],
          [fn("COUNT", col("id")), "count"],
        ],
        where: {
          submittedAt: { [Op.gte]: startDate },
        },
        group: [fn("DATE", col("submittedAt"))],
        order: [[fn("DATE", col("submittedAt")), "ASC"]],
        raw: true,
      }),

      // Category statistics
      Application.findAll({
        attributes: ["category", [fn("COUNT", col("id")), "count"]],
        where: { isActive: true },
        group: ["category"],
        raw: true,
      }),

      // Status distribution
      UserApplication.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
        raw: true,
      }),
    ]);

  res.json({
    success: true,
    data: {
      userGrowth,
      submissionTrends,
      categoryStats,
      statusDistribution,
    },
  });
});

// Get application analytics
exports.getApplicationAnalytics = catchAsync(async (req, res) => {
  const popularApplications = await UserApplication.findAll({
    attributes: [[fn("COUNT", col("UserApplication.id")), "submissionCount"]],
    include: [
      {
        model: Application,
        as: "application",
        attributes: ["id", "title", "category"],
      },
    ],
    group: ["application.id", "application.title", "application.category"],
    order: [[fn("COUNT", col("UserApplication.id")), "DESC"]],
    limit: 10,
    raw: false,
  });

  res.json({
    success: true,
    data: { popularApplications },
  });
});

// Get payment analytics
exports.getPaymentAnalytics = catchAsync(async (req, res) => {
  const { period = "30" } = req.query;
  const days = parseInt(period);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [revenueOverTime, paymentMethods, totalRevenue, averagePayment] =
    await Promise.all([
      // Revenue over time
      Payment.findAll({
        attributes: [
          [fn("DATE", col("paidAt")), "date"],
          [fn("SUM", col("amount")), "revenue"],
          [fn("COUNT", col("id")), "transactions"],
        ],
        where: {
          status: "completed",
          paidAt: { [Op.gte]: startDate },
        },
        group: [fn("DATE", col("paidAt"))],
        order: [[fn("DATE", col("paidAt")), "ASC"]],
        raw: true,
      }),

      // Payment methods distribution
      Payment.findAll({
        attributes: [
          "paymentGateway",
          [fn("COUNT", col("id")), "count"],
          [fn("SUM", col("amount")), "total"],
        ],
        where: { status: "completed" },
        group: ["paymentGateway"],
        raw: true,
      }),

      // Total revenue
      Payment.sum("amount", {
        where: { status: "completed" },
      }),

      // Average payment
      Payment.findOne({
        attributes: [[fn("AVG", col("amount")), "average"]],
        where: { status: "completed" },
        raw: true,
      }),
    ]);

  res.json({
    success: true,
    data: {
      revenueOverTime,
      paymentMethods,
      totalRevenue: totalRevenue || 0,
      averagePayment: averagePayment?.average || 0,
    },
  });
});
