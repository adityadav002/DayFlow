const { z } = require('zod');
const { CONTEXT_TYPES } = require('../utils/constants');

const getCalendarSchema = z.object({
  startDate: z.coerce.date({ required_error: 'startDate is required' }),
  endDate: z.coerce.date({ required_error: 'endDate is required' }),
  context: z.enum(CONTEXT_TYPES).optional(),
  types: z.string().optional().default('tasks,events,reminders')
}).refine(data => data.endDate >= data.startDate, {
  message: 'endDate must be after or equal to startDate',
  path: ['endDate']
}).refine(data => {
  const diffTime = Math.abs(data.endDate - data.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 366; // Limit to roughly 1 year
}, {
  message: 'Query range cannot exceed 1 year',
  path: ['endDate']
});

module.exports = {
  getCalendarSchema
};
