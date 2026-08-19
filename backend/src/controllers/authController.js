const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');

const setTokenCookies = (res, accessToken, refreshToken) => {
  const accessOpts = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 mins
  };

  const refreshOpts = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('accessToken', accessToken, accessOpts);
  res.cookie('refreshToken', refreshToken, refreshOpts);
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  setTokenCookies(res, accessToken, refreshToken);
  res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
  setTokenCookies(res, accessToken, refreshToken);
  res.status(200).json(new ApiResponse(200, user, 'User logged in successfully'));
});

const refresh = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, env.REFRESH_TOKEN_SECRET);
    const User = require('../models/User'); // Import here to avoid circular dep if any
    const user = await User.findById(decodedToken._id);

    if (!user || !user.refreshTokens.includes(incomingRefreshToken)) {
      throw new ApiError(401, 'Refresh token is invalid or expired');
    }

    const { generateAccessAndRefreshTokens } = require('../utils/generateTokens');
    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user._id);

    user.refreshTokens = user.refreshTokens.filter((t) => t !== incomingRefreshToken);
    user.refreshTokens.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json(new ApiResponse(200, {}, 'Tokens rotated successfully'));
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }
});

const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user._id, req.cookies.refreshToken);
  clearTokenCookies(res);
  res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAllDevices(req.user._id);
  clearTokenCookies(res);
  res.status(200).json(new ApiResponse(200, {}, 'Logged out from all devices'));
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, 'Current user fetched successfully'));
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword
};
