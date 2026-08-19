const { z } = require('zod');

// Regex for MongoDB ObjectId
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters')
});

const updateBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters')
});

const addMemberSchema = z.object({
  email: z.string().email('Invalid email format')
});

module.exports = {
  createBoardSchema,
  updateBoardSchema,
  addMemberSchema,
  objectIdRegex
};
