const { z } = require('zod');
const { TASK_STATUS, TASK_PRIORITIES } = require('./src/utils/constants');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional().nullable(),
  status: z.enum(TASK_STATUS).optional(),
  position: z.number().positive('Position must be a positive number').optional()
});

try {
  createTaskSchema.parse({
    title: 'Deploy',
    description: 'ready to deploy',
    priority: 'Low',
    dueDate: '2026-07-15'
  });
} catch (e) {
  console.log('Is ZodError:', e instanceof z.ZodError);
  console.log('e.errors:', e.errors);
  console.log('e.issues:', e.issues);
  console.log('Type of e:', e.constructor.name);
}
