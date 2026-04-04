import { FinancialRecord, RecordType } from '../modules/records/record.model';
import { logger } from '../utils/logger';

interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
  recordCount: number;
  dateRange?: { from: string | null; to: string | null };
}

interface CategoryData {
  category: string;
  type: RecordType;
  total: number;
  count: number;
  percentage: number;
}

interface TrendData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface TopCategoryData {
  rank: number;
  category: string;
  total: number;
  percentage: number;
}

/**
 * Build a Mongoose $match stage that respects an optional date range.
 * Used across all aggregations for consistency.
 */
const buildBaseMatch = (range?: DateRangeFilter) => {
  const match: Record<string, unknown> = { isDeleted: false };
  if (range?.from || range?.to) {
    const dateFilter: Record<string, Date> = {};
    if (range.from) dateFilter.$gte = range.from;
    if (range.to) dateFilter.$lte = range.to;
    match.date = dateFilter;
  }
  return match;
};

/**
 * Get dashboard summary — supports an optional date range filter.
 * Section 1.5: Uses $facet to compute summary and count in a single pipeline pass
 */
export const getDashboardSummary = async (range?: DateRangeFilter): Promise<SummaryData> => {
  const result = await FinancialRecord.aggregate([
    { $match: buildBaseMatch(range) },
    {
      $facet: {
        byType: [
          { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ],
        totalCount: [{ $count: 'n' }]
      }
    }
  ]).allowDiskUse(true);

  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let recordCount = 0;

  const byType = result[0]?.byType || [];
  const totalCountArr = result[0]?.totalCount || [];
  
  if (totalCountArr.length > 0) {
    recordCount = totalCountArr[0].n;
  }

  byType.forEach((item: any) => {
    if (item._id === RecordType.INCOME) {
      totalIncome = Math.round(item.total * 100) / 100;
      incomeCount = item.count;
    } else if (item._id === RecordType.EXPENSE) {
      totalExpense = Math.round(item.total * 100) / 100;
      expenseCount = item.count;
    }
  });

  logger.info('Dashboard summary generated');

  return {
    totalIncome,
    totalExpense,
    netBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
    incomeCount,
    expenseCount,
    recordCount,
    dateRange: range
      ? {
          from: range.from ? range.from.toISOString() : null,
          to: range.to ? range.to.toISOString() : null,
        }
      : undefined,
  };
};

/**
 * Get records by category with optional date range.
 */
export const getRecordsByCategory = async (range?: DateRangeFilter): Promise<CategoryData[]> => {
  const result = await FinancialRecord.aggregate([
    { $match: buildBaseMatch(range) },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]).allowDiskUse(true);

  const grandTotal = result.reduce((sum, item) => sum + item.total, 0);

  logger.info('Category breakdown generated');

  return result.map((item) => ({
    category: item._id.category,
    type: item._id.type,
    total: Math.round(item.total * 100) / 100,
    count: item.count,
    percentage: grandTotal > 0 ? Math.round((item.total / grandTotal) * 10000) / 100 : 0,
  }));
};

/**
 * Get monthly trends for a given year (defaults to current year).
 */
export const getMonthlyTrends = async (year?: number): Promise<TrendData[]> => {
  const targetYear = year || new Date().getFullYear();

  if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
    throw new Error('Invalid year parameter');
  }

  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]).allowDiskUse(true);

  const monthlyMap = new Map<string, { income: number; expense: number }>();

  result.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-01`;
    if (!monthlyMap.has(key)) monthlyMap.set(key, { income: 0, expense: 0 });
    const d = monthlyMap.get(key)!;
    if (item._id.type === RecordType.INCOME) {
      d.income = Math.round(item.total * 100) / 100;
    } else {
      d.expense = Math.round(item.total * 100) / 100;
    }
  });

  logger.info(`Monthly trends generated for ${targetYear}`);

  return Array.from(monthlyMap.entries())
    .map(([month, d]) => ({
      month,
      income: d.income,
      expense: d.expense,
      net: Math.round((d.income - d.expense) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Get recent records (max 20).
 */
export const getRecentRecords = async (limit: number = 10) => {
  const maxLimit = Math.min(Math.max(1, limit), 20);

  const records = await FinancialRecord.find({ isDeleted: false })
    .select('title amount type category date createdBy createdAt')
    .sort({ date: -1, createdAt: -1 })
    .limit(maxLimit)
    .populate('createdBy', 'name email')
    .lean()
    .exec();

  logger.info(`Recent records retrieved (limit: ${maxLimit})`);
  return records;
};

/**
 * Get top 5 expense categories with optional date range.
 */
export const getTopExpenseCategories = async (
  range?: DateRangeFilter
): Promise<TopCategoryData[]> => {
  const match = buildBaseMatch(range);
  (match as any).type = RecordType.EXPENSE;

  const result = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]).allowDiskUse(true);

  const grandTotal = result.reduce((sum, item) => sum + item.total, 0);

  logger.info('Top expense categories generated');

  return result.map((item, index) => ({
    rank: index + 1,
    category: item._id,
    total: Math.round(item.total * 100) / 100,
    percentage: grandTotal > 0 ? Math.round((item.total / grandTotal) * 10000) / 100 : 0,
  }));
};
