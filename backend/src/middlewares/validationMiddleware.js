const ApiError = require('../utils/ApiError');
const { ERROR_CODES } = require('../utils/constants');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // Override with parsed/sanitized data
      next();
    } catch (error) {
      if (error.errors || error.issues) {
        const issues = error.errors || error.issues || [];
        const errors = issues.map((err) => ({
          field: err?.path?.join('.') || 'unknown',
          message: err?.message || 'Invalid input'
        }));
        return next(new ApiError(400, 'Validation Error', errors, true, ERROR_CODES.VALIDATION_ERROR));
      }
      next(error);
    }
  };
};

module.exports = validate;
