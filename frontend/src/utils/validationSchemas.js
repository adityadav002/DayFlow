import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number')
});

export const boardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters')
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional().default(''),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional().default('Medium'),
  dueDate: z.string().optional().nullable(),
  context: z.enum(['work', 'personal', 'study', 'health', 'finance', 'family', 'other']).optional().default('work'),
  startDate: z.string().optional().nullable(),
  estimatedDuration: z.preprocess((val) => (val === '' || val === undefined || val === null ? null : Number(val)), z.number().int().nonnegative().nullable()).optional(),
  assignedTo: z.string().optional().nullable()
});
