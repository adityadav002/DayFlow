const ApiError = require('../utils/ApiError');

const notFoundMiddleware = (req, res, next) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

module.exports = notFoundMiddleware;
