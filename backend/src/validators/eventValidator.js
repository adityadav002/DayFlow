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

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional().default(''),
  participants: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')).optional().default([]),
  team: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid team ID').optional().nullable(),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID').optional().nullable(),
  startDateTime: z.coerce.date({ required_error: 'Start datetime is required' }),
  endDateTime: z.coerce.date({ required_error: 'End datetime is required' }),
  allDay: z.boolean().optional().default(false),
  location: z.string().optional().default(''),
  context: z.enum(CONTEXT_TYPES).optional().default('work'),
  color: z.string().optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: recurrenceRuleSchema,
  parentRecurringEvent: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID').optional().nullable()
}).refine(data => data.endDateTime >= data.startDateTime, {
  message: 'End date and time must be after or equal to start date and time',
  path: ['endDateTime']
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  participants: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')).optional(),
  team: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid team ID').optional().nullable(),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID').optional().nullable(),
  startDateTime: z.coerce.date().optional(),
  endDateTime: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  context: z.enum(CONTEXT_TYPES).optional(),
  color: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: recurrenceRuleSchema,
  parentRecurringEvent: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID').optional().nullable()
}).refine(data => {
  if (data.startDateTime && data.endDateTime) {
    return data.endDateTime >= data.startDateTime;
  }
  return true;
}, {
  message: 'End date and time must be after or equal to start date and time',
  path: ['endDateTime']
});

module.exports = {
  createEventSchema,
  updateEventSchema
};
