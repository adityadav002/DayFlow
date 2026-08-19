const calendarService = require('../services/calendarService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCalendarData = asyncHandler(async (req, res) => {
  const data = await calendarService.getCalendarData(req.query, req.user._id);
  res.status(200).json(new ApiResponse(200, data, 'Calendar data fetched successfully'));
});

module.exports = {
  getCalendarData
};
