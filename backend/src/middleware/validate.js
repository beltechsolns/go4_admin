import { validationResult } from 'express-validator';

/**
 * Middleware to check for validation errors from express-validator
 * Returns 400 with array of errors if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(e => ({
        field: e.path || e.param,
        message: e.msg,
      })),
    });
  }
  next();
};

export default validate;
