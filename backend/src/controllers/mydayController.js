const mydayService = require('../services/mydayService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getMyDayData = asyncHandler(async (req, res) => {
  const data = await mydayService.getMyDayData(req.query.date, req.user._id);
  res.status(200).json(new ApiResponse(200, data, 'My Day data fetched successfully'));
});

const addToMyDay = asyncHandler(async (req, res) => {
  const data = await mydayService.addToMyDay(req.body.taskId, req.body.date, req.user._id);
  if (!data) {
    return res.status(404).json({ success: false, message: 'Task not found or access denied' });
  }
  res.status(200).json(new ApiResponse(200, data, 'Task added to My Day successfully'));
});

const removeFromMyDay = asyncHandler(async (req, res) => {
  const data = await mydayService.removeFromMyDay(req.body.taskId, req.user._id);
  if (!data) {
    return res.status(404).json({ success: false, message: 'Task not found or access denied' });
  }
  res.status(200).json(new ApiResponse(200, data, 'Task removed from My Day successfully'));
});

module.exports = {
  getMyDayData,
  addToMyDay,
  removeFromMyDay
};
