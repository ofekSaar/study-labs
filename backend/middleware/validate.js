import { validationResult } from 'express-validator';
import createError from 'http-errors';

/**
 * Middleware to run after express-validator checks.
 * Returns 400 with validation errors if any checks failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = createError(400, 'Validation failed');
    error.errors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    return next(error);
  }

  next();
};

export default validate;
