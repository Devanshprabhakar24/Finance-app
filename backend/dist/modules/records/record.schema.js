"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordFilterSchema = exports.updateRecordSchema = exports.createRecordSchema = exports.recordTypeEnum = void 0;
const zod_1 = require("zod");
exports.recordTypeEnum = zod_1.z.enum(['INCOME', 'EXPENSE']);
exports.createRecordSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title must not exceed 100 characters')
        .transform((val) => val.trim()),
    amount: zod_1.z
        .number()
        .positive('Amount must be positive')
        .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
    type: exports.recordTypeEnum,
    category: zod_1.z
        .string()
        .min(2, 'Category must be at least 2 characters')
        .max(50, 'Category must not exceed 50 characters')
        .transform((val) => val.trim()),
    date: zod_1.z
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
        message: 'Date cannot be in the future',
    })
        .transform((date) => {
        // Convert YYYY-MM-DD to ISO datetime string for consistency
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return new Date(date + 'T00:00:00.000Z').toISOString();
        }
        return date;
    }),
    notes: zod_1.z
        .string()
        .max(500, 'Notes must not exceed 500 characters')
        .optional()
        .transform((val) => val?.trim()),
});
exports.updateRecordSchema = exports.createRecordSchema.partial();
exports.recordFilterSchema = zod_1.z
    .object({
    type: exports.recordTypeEnum.optional(),
    category: zod_1.z.string().optional(),
    // Full-text search on title, notes, category
    search: zod_1.z.string().max(100).optional(),
    from: zod_1.z.string().datetime('Invalid from date').optional(),
    to: zod_1.z.string().datetime('Invalid to date').optional(),
    page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().positive()).optional(),
    limit: zod_1.z
        .string()
        .transform(Number)
        .pipe(zod_1.z.number().int().min(1).max(100))
        .optional(),
    sortBy: zod_1.z.enum(['date', 'amount', 'category', 'title']).optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional(),
})
    .superRefine((data, ctx) => {
    if (data.from && data.to && new Date(data.from) > new Date(data.to)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'From date must be before or equal to To date',
            path: ['to'],
        });
    }
});
