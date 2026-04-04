import { z } from 'zod';

/**
 * Record Schemas - Mirror backend validation
 */

export const recordTypeEnum = z.enum(['INCOME', 'EXPENSE']);

/**
 * Create Record Schema
 */
export const createRecordSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must not exceed 100 characters'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
  type: recordTypeEnum,
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters'),
  date: z
    .string()
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime()) && d <= new Date();
    }, {
      message: 'Date cannot be in the future',
    }),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
  attachment: z
    .string()
    .url('Invalid attachment URL')
    .optional(),
});

/**
 * Update Record Schema (all fields optional)
 */
export const updateRecordSchema = createRecordSchema.partial();

/**
 * Record Filter Schema
 */
export const recordFilterSchema = z
  .object({
    search: z.string().optional(),
    type: recordTypeEnum.optional(),
    category: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    sortBy: z.enum(['date', 'amount', 'category', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fromDate && data.toDate && new Date(data.fromDate) > new Date(data.toDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'From date must be before or equal to To date',
        path: ['toDate'],
      });
    }
  });

/**
 * Type exports
 */
export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordFilterInput = z.infer<typeof recordFilterSchema>;
export type RecordType = z.infer<typeof recordTypeEnum>;
