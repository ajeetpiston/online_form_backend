const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { AppError } = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");

// Authenticate user
exports.authenticate = catchAsync(async (req, res, next) => {
  // Get token from header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Access token is required", 401);
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Token has expired", 401);
    } else if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid token", 401);
    } else {
      throw new AppError("Token verification failed", 401);
    }
  }

  // Check if user still exists
  const user = await User.findByPk(decoded.userId);
  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError("Your account has been deactivated", 401);
  }

  // Grant access to protected route
  req.user = user;
  next();
});

// Authorize user roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403
      );
    }
    next();
  };
};

// Optional authentication (for public routes that can benefit from user context)
exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
});
