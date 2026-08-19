const { z } = require('zod');
const { CONTEXT_TYPES } = require('../utils/constants');

const coerceNullableDate = z.preprocess((val) => {
  if (val === '' || val === undefined || val === null) return null;
  return val;
}, z.coerce.date().optional().nullable());

const recurrenceRuleSchema = z.object({
  frequency: z.string().optional().nullable(),
  interval: z.number().optional().nullable(),
  daysOfWeek: z.array(z.number()).optional().nullable(),
  dayOfMonth: z.number().optional().nullable(),
  endDate: coerceNullableDate,
  occurrenceCount: z.number().optional().nullable(),
  timezone: z.string().optional().nullable()
}).optional().nullable();

const createReminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional().default(''),
  reminderDateTime: z.coerce.date({ required_error: 'Reminder date and time is required' }),
  context: z.enum(CONTEXT_TYPES).optional().default('personal'),
  isCompleted: z.boolean().optional().default(false),
  completedAt: coerceNullableDate,
  linkedTask: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID').optional().nullable(),
  linkedEvent: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID').optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: recurrenceRuleSchema
});

const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  reminderDateTime: z.coerce.date().optional(),
  context: z.enum(CONTEXT_TYPES).optional(),
  isCompleted: z.boolean().optional(),
  completedAt: coerceNullableDate,
  linkedTask: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID').optional().nullable(),
  linkedEvent: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID').optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: recurrenceRuleSchema
});

module.exports = {
  createReminderSchema,
  updateReminderSchema
};
