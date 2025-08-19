const logger = require("../utils/logger");
const { AppError } = require("../utils/appError");

// Handle Sequelize validation errors
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map((error) => ({
    field: error.path,
    message: error.message,
  }));

  return new AppError("Validation failed", 400, errors);
};

// Handle Sequelize unique constraint errors
const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors[0].path;
  const message = `${field} already exists`;
  return new AppError(message, 400);
};

// Handle Sequelize foreign key constraint errors
const handleSequelizeForeignKeyConstraintError = (err) => {
  return new AppError("Referenced resource does not exist", 400);
};

// Handle JWT errors
const handleJWTError = () => new AppError("Invalid token", 401);
const handleJWTExpiredError = () => new AppError("Token has expired", 401);

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    ...(err.errors && { errors: err.errors }),
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error("ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

// Global error handler
exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === "SequelizeValidationError") {
      error = handleSequelizeValidationError(error);
    } else if (err.name === "SequelizeUniqueConstraintError") {
      error = handleSequelizeUniqueConstraintError(error);
    } else if (err.name === "SequelizeForeignKeyConstraintError") {
      error = handleSequelizeForeignKeyConstraintError(error);
    } else if (err.name === "JsonWebTokenError") {
      error = handleJWTError();
    } else if (err.name === "TokenExpiredError") {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
};

// Handle 404 errors
exports.notFound = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};
