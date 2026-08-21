const ApiError = require('../utils/ApiError');
const { ERROR_CODES } = require('../utils/constants');

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode ? error.statusCode : 500;
    const message = error.message || 'Internal Server Error';
    let errors = [];

    // Mongoose bad ObjectId
    if (error.name === 'CastError') {
      error = new ApiError(400, 'Resource not found', [], true);
      error.errorCode = ERROR_CODES.NOT_FOUND;
    }
    else if (error.name === 'ValidationError') {
      errors = Object.values(error.errors).map((val) => ({
        field: val.path,
        message: val.message
      }));
      console.error('[MONGOOSE VALIDATION ERRORS]:', errors);
      error = new ApiError(400, 'Validation Error', errors, true);
      error.errorCode = ERROR_CODES.VALIDATION_ERROR;
    }
    // Mongoose duplicate key
    else if (error.code === 11000) {
      error = new ApiError(400, 'Duplicate field value entered', [], true);
      error.errorCode = ERROR_CODES.CONFLICT;
    }
    // Multer error
    else if (error.name === 'MulterError') {
      error = new ApiError(400, error.message, [], true);
      error.errorCode = ERROR_CODES.VALIDATION_ERROR;
    } else {
      error = new ApiError(statusCode, message, [], false, ERROR_CODES.INTERNAL_SERVER_ERROR, error.stack);
    }
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors,
    statusCode: error.statusCode,
    errorCode: error.errorCode
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }
  
  // Log the actual error to the console so we can see what threw the 500!
  console.error('[500 ERROR DETAILS]:', error.stack || error);

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorMiddleware;
