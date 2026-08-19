const Notification = require('../models/Notification');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Fetch paginated list of notifications for the authenticated user.
 */
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const unreadOnly = req.query.unreadOnly === 'true';

  const filter = { recipient: req.user._id };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const total = await Notification.countDocuments(filter);
  const notifications = await Notification.find(filter)
    .populate('actor', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  res.status(200).json(new ApiResponse(200, {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }, 'Notifications fetched successfully'));
});

/**
 * Mark a single notification as read.
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.status(200).json(new ApiResponse(200, notification, 'Notification marked as read'));
});

/**
 * Mark all unread notifications of the user as read.
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.status(200).json(new ApiResponse(200, { modifiedCount: result.modifiedCount }, 'All notifications marked as read'));
});

/**
 * Delete a single notification.
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  res.status(200).json(new ApiResponse(200, {}, 'Notification deleted successfully'));
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
