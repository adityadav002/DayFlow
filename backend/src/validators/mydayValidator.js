const { z } = require('zod');

const getMyDayQuerySchema = z.object({
  date: z.coerce.date({ required_error: 'date is required' })
});

const addRemoveMyDaySchema = z.object({
  taskId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID'),
  date: z.coerce.date({ required_error: 'date is required' })
});

module.exports = {
  getMyDayQuerySchema,
  addRemoveMyDaySchema
};
