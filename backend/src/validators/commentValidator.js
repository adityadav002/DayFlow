const { z } = require('zod');

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content cannot exceed 10000 characters').optional(),
  message: z.string().min(1, 'Message is required').max(10000, 'Message cannot exceed 10000 characters').optional()
}).refine(data => data.content || data.message, {
  message: 'Either content or message is required',
  path: ['content']
});

module.exports = {
  createCommentSchema
};
