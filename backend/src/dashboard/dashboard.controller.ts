import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as dashboardService from './dashboard.service';
import { ValidationError } from '../middleware/errorHandler';

/**
 * Parse an optional ISO date string from a query param.
 * Returns undefined (not null) so callers can use ?? cleanly.
 */
const parseDate = (val: unknown, paramName: string): Date | undefined => {
  if (!val) return undefined;
  const d = new Date(val as string);
  if (isNaN(d.getTime())) {
    throw new ValidationError(`Invalid date for parameter '${paramName}'`);
  }
  return d;
};

/**
 * GET /api/dashboard/summary
 * Optional query: ?from=ISO&to=ISO
 */
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const from = parseDate(req.query.from, 'from');
  const to = parseDate(req.query.to, 'to');

  if (from && to && from > to) {
    throw new ValidationError("'from' date must be before or equal to 'to' date");
  }

  const summary = await dashboardService.getDashboardSummary(
    from || to ? { from, to } : undefined
  );
  sendSuccess(res, 'Dashboard summary retrieved successfully', summary);
});

/**
 * GET /api/dashboard/by-category
 * Optional query: ?from=ISO&to=ISO
 */
export const getByCategory = asyncHandler(async (req: Request, res: Response) => {
  const from = parseDate(req.query.from, 'from');
  const to = parseDate(req.query.to, 'to');

  const categoryData = await dashboardService.getRecordsByCategory(
    from || to ? { from, to } : undefined
  );
  sendSuccess(res, 'Category breakdown retrieved successfully', categoryData);
});

/**
 * GET /api/dashboard/trends
 * Optional query: ?year=2024
 */
export const getTrends = asyncHandler(async (req: Request, res: Response) => {
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;
  const trends = await dashboardService.getMonthlyTrends(year);
  sendSuccess(res, 'Monthly trends retrieved successfully', trends);
});

/**
 * GET /api/dashboard/recent
 * Optional query: ?limit=10 (max 20)
 */
export const getRecent = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const records = await dashboardService.getRecentRecords(limit);
  sendSuccess(res, 'Recent records retrieved successfully', records);
});

/**
 * GET /api/dashboard/top-categories
 * Optional query: ?from=ISO&to=ISO
 */
export const getTopCategories = asyncHandler(async (req: Request, res: Response) => {
  const from = parseDate(req.query.from, 'from');
  const to = parseDate(req.query.to, 'to');

  const topCategories = await dashboardService.getTopExpenseCategories(
    from || to ? { from, to } : undefined
  );
  sendSuccess(res, 'Top expense categories retrieved successfully', topCategories);
});
