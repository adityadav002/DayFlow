const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ERROR_CODES } = require('../utils/constants');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided', [], true, ERROR_CODES.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById(decoded._id).select('-password');
    if (!req.user) {
      throw new Error('User not found');
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired', [], true, ERROR_CODES.TOKEN_EXPIRED);
    }
    throw new ApiError(401, 'Not authorized, token failed', [], true, ERROR_CODES.UNAUTHORIZED);
  }
});

module.exports = { protect };
