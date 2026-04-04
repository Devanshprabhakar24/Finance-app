import { z } from 'zod';

export const recordTypeEnum = z.enum(['INCOME', 'EXPENSE']);

export const createRecordSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must not exceed 100 characters')
    .transform((val) => val.trim()),
  amount: z
    .number()
    .positive('Amount must be positive')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
  type: recordTypeEnum,
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters')
    .transform((val) => val.trim()),
  date: z
    .string()
    .datetime('Invalid date format')
    .refine((date) => new Date(date) <= new Date(), {
      message: 'Date cannot be in the future',
    }),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .transform((val) => val?.trim()),
});

export const updateRecordSchema = createRecordSchema.partial();

export const recordFilterSchema = z
  .object({
    type: recordTypeEnum.optional(),
    category: z.string().optional(),
    // Full-text search on title, notes, category
    search: z.string().max(100).optional(),
    from: z.string().datetime('Invalid from date').optional(),
    to: z.string().datetime('Invalid to date').optional(),
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional(),
    sortBy: z.enum(['date', 'amount', 'category', 'title']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && new Date(data.from) > new Date(data.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'From date must be before or equal to To date',
        path: ['to'],
      });
    }
  });

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordFilterInput = z.infer<typeof recordFilterSchema>;
export type RecordType = z.infer<typeof recordTypeEnum>;
