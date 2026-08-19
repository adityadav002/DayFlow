const { z } = require('zod');
const { TASK_STATUS, TASK_PRIORITIES, CONTEXT_TYPES } = require('../utils/constants');

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

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional().nullable().default(''),
  priority: z.enum(TASK_PRIORITIES).optional().default('Medium'),
  dueDate: coerceNullableDate,
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional().nullable(),
  status: z.enum(TASK_STATUS).optional().default('Todo'),
  position: z.number().optional(),
  context: z.enum(CONTEXT_TYPES).optional().default('work'),
  startDate: coerceNullableDate,
  estimatedDuration: z.number().int().nonnegative().optional().nullable(),
  actualDuration: z.number().int().nonnegative().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID').optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: recurrenceRuleSchema,
  parentRecurringTask: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent task ID').optional().nullable(),
  parentTask: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent task ID').optional().nullable()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: coerceNullableDate,
  assignedTo: z.preprocess((val) => (val === '' ? null : val), z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional().nullable()),
  status: z.enum(TASK_STATUS).optional(),
  position: z.number().optional(),
  context: z.enum(CONTEXT_TYPES).optional(),
  startDate: coerceNullableDate,
  estimatedDuration: z.number().int().nonnegative().optional().nullable(),
  actualDuration: z.number().int().nonnegative().optional().nullable(),
  tags: z.array(z.string()).optional(),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID').optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: recurrenceRuleSchema,
  parentRecurringTask: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent task ID').optional().nullable(),
  parentTask: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent task ID').optional().nullable(),
  version: z.number().int().min(0, 'Version is required for updates')
});

const bulkUpdatePositionsSchema = z.object({
  boardId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid board ID'),
  tasks: z.array(
    z.object({
      taskId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID'),
      status: z.enum(TASK_STATUS),
      position: z.number(),
      version: z.number().int().min(0)
    })
  ).min(1, 'At least one task must be provided')
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  bulkUpdatePositionsSchema
};
