import { z } from 'zod';
import { FEEDBACK_PRIORITIES, FEEDBACK_TYPES } from '@/constants/feedback';

export const feedbackSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.string().optional(),
  type: z.enum(FEEDBACK_TYPES.map((t) => t.value) as [string, ...string[]]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(FEEDBACK_PRIORITIES.map((p) => p.value) as [string, ...string[]]),
});

export type FeedbackSchemaType = z.infer<typeof feedbackSchema>;
