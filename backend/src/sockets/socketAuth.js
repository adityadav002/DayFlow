const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const env = require('../config/env');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    let token;
    
    // Attempt to get token from cookies
    if (socket.request.headers.cookie) {
      const cookies = cookie.parse(socket.request.headers.cookie);
      token = cookies.accessToken;
    }

    // Fallback to handshake auth
    if (!token && socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select('-password -refreshTokens');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
