const { validationResult } = require("express-validator");
const { AppError } = require("../utils/appError");

exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    throw new AppError("Validation failed", 400, formattedErrors);
  }

  next();
};
