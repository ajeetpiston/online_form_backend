const { Op } = require("sequelize");
const { Application, FormField, User } = require("../models");
const { AppError } = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");

// Get all applications with pagination and filtering
exports.getApplications = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const where = { isActive: true };

  // Add category filter
  if (category) {
    where.category = category;
  }

  // Define sort options
  const validSortFields = ["createdAt", "title", "priority", "estimatedTime"];
  const orderBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const { count, rows: applications } = await Application.findAndCountAll({
    where,
    include: [
      {
        model: FormField,
        as: "formFields",
        attributes: [
          "id",
          "label",
          "fieldType",
          "isRequired",
          "options",
          "placeholder",
          "order",
        ],
        order: [["order", "ASC"]],
      },
    ],
    order: [[orderBy, order]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
});

// Search applications
exports.searchApplications = catchAsync(async (req, res) => {
  const { q: searchQuery, category, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  const where = { isActive: true };

  // Add search conditions
  if (searchQuery) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${searchQuery}%` } },
      { description: { [Op.iLike]: `%${searchQuery}%` } },
      { tags: { [Op.contains]: [searchQuery] } },
    ];
  }

  // Add category filter
  if (category) {
    where.category = category;
  }

  const { count, rows: applications } = await Application.findAndCountAll({
    where,
    include: [
      {
        model: FormField,
        as: "formFields",
        attributes: ["id", "label", "fieldType", "isRequired"],
      },
    ],
    order: [
      ["priority", "DESC"],
      ["createdAt", "DESC"],
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      applications,
      searchQuery,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

// Get single application by ID
exports.getApplication = catchAsync(async (req, res) => {
  const { id } = req.params;

  const application = await Application.findOne({
    where: { id, isActive: true },
    include: [
      {
        model: FormField,
        as: "formFields",
        order: [["order", "ASC"]],
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "name"],
      },
    ],
  });

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  res.json({
    success: true,
    data: { application },
  });
});

// Get application categories
exports.getCategories = catchAsync(async (req, res) => {
  const categories = await Application.findAll({
    attributes: ["category"],
    where: { isActive: true },
    group: ["category"],
    raw: true,
  });

  const categoryList = categories.map((item) => item.category);

  res.json({
    success: true,
    data: {
      categories: categoryList,
    },
  });
});
