const { z  } = require('zod');

const recordTypeEnum = z.enum(['INCOME', 'EXPENSE']);

const createRecordSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must not exceed 100 characters')
    .transform((val) => val.trim()),
  amount: z
    .number()
    .positive('Amount must be positive')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
  type,
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters')
    .transform((val) => val.trim()),
  date: z
    .string()
    .refine((date) => {
      // Accept both YYYY-MM-DD and ISO datetime formats
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      return dateRegex.test(date) || datetimeRegex.test(date);
    }, 'Invalid date format')
    .refine((date) => {
      const inputDate = new Date(date);
      const today = new Date();
      
      // If input is just YYYY-MM-DD, compare dates only
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const todayDateString = today.toISOString().split('T')[0];
        return date <= todayDateString;
      }
      
      // For datetime strings, allow until end of today
      today.setHours(23, 59, 59, 999);
      return inputDate <= today;
    }, {
      message,
    })
    .transform((date) => {
      // Convert YYYY-MM-DD to ISO datetime string for consistency
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return new Date(date + 'T00:00).toISOString();
      }
      return date;
    }),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .transform((val) => val?.trim()),
});

const updateRecordSchema = createRecordSchema.partial();

const recordFilterSchema = z
  .object({
    type),
    category).optional(),
    // Full-text search on title, notes, category
    search).max(100).optional(),
    from).datetime('Invalid from date').optional(),
    to).datetime('Invalid to date').optional(),
    page).transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional(),
    sortBy, 'amount', 'category', 'title']).optional(),
    order, 'desc']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && new Date(data.from) > new Date(data.to)) {
      ctx.addIssue({
        code,
        message,
        path,
      });
    }
  });

 z.infer<typeof createRecordSchema>;
 z.infer<typeof updateRecordSchema>;
 z.infer<typeof recordFilterSchema>;
 z.infer<typeof recordTypeEnum>;
