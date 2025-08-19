const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const { sendEmail } = require("../utils/emailService");
const logger = require("../utils/logger");
const { AppError } = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
};

// Register user
exports.register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    emailVerificationToken,
  });

  // Send verification email
  try {
    await sendEmail({
      to: email,
      subject: "Verify Your Email - Online Forms",
      template: "emailVerification",
      data: {
        name,
        verificationToken: emailVerificationToken,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
      },
    });
  } catch (error) {
    logger.error("Failed to send verification email:", error);
  }

  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.status(201).json({
    success: true,
    message:
      "User registered successfully. Please check your email for verification.",
    data: {
      user,
      token,
      refreshToken,
    },
  });
});

// Login user
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.scope("withPassword").findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError(
      "Your account has been deactivated. Please contact support.",
      401
    );
  }

  // Update last login
  await user.update({ lastLogin: new Date() });

  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user,
      token,
      refreshToken,
    },
  });
});

// Logout user
exports.logout = catchAsync(async (req, res) => {
  // In a production app, you might want to blacklist the token
  res.json({
    success: true,
    message: "Logout successful",
  });
});

// Refresh token
exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      throw new AppError("Invalid refresh token", 401);
    }

    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError("No user found with this email address", 404);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.update({
    passwordResetToken: resetToken,
    passwordResetExpires,
  });

  // Send reset email
  try {
    await sendEmail({
      to: email,
      subject: "Password Reset - Online Forms",
      template: "passwordReset",
      data: {
        name: user.name,
        resetToken,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      },
    });

    res.json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    await user.update({
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    throw new AppError("Failed to send password reset email", 500);
  }
});

// Reset password
exports.resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [require("sequelize").Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  await user.update({
    password,
    passwordResetToken: null,
    passwordResetExpires: null,
  });

  res.json({
    success: true,
    message: "Password reset successful",
  });
});

// Change password
exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const user = await User.scope("withPassword").findByPk(userId);
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect", 400);
  }

  await user.update({ password: newPassword });

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

// Verify email
exports.verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.body;

  const user = await User.findOne({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    throw new AppError("Invalid verification token", 400);
  }

  await user.update({
    emailVerified: true,
    emailVerificationToken: null,
  });

  res.json({
    success: true,
    message: "Email verified successfully",
  });
});

// Resend verification email
exports.resendVerification = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (user.emailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  await user.update({ emailVerificationToken });

  await sendEmail({
    to: user.email,
    subject: "Verify Your Email - Online Forms",
    template: "emailVerification",
    data: {
      name: user.name,
      verificationToken: emailVerificationToken,
      verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
    },
  });

  res.json({
    success: true,
    message: "Verification email sent successfully",
  });
});

// Get user profile
exports.getProfile = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  res.json({
    success: true,
    data: { user },
  });
});

// Update user profile
exports.updateProfile = catchAsync(async (req, res) => {
  const { name, phone, profileImage } = req.body;
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  await user.update({
    name: name || user.name,
    phone: phone || user.phone,
    profileImage: profileImage || user.profileImage,
  });

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
});
