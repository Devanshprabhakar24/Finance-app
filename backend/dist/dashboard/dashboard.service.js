const { FinancialRecord, RecordType  } = require('../modules/records/record.model');
const { logger  } = require('../utils/logger');

;
}

/**
 * Build a Mongoose $match stage that respects an optional date range.
 * Used across all aggregations for consistency.
 */
const buildBaseMatch = (range: DateRangeFilter) => {
  const match= { isDeleted: false };
  if (range?.from || range?.to) {
    const dateFilter= {};
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
const getDashboardSummary = async (range: DateRangeFilter)=> {
  const result = await FinancialRecord.aggregate([
    { $match) },
    {
      $facet: {
        byType: [
          { $group: { _id, total: { $sum, count: { $sum: 1 } } }
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

  byType.forEach((item) => {
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
    netBalance) * 100) / 100,
    incomeCount,
    expenseCount,
    recordCount,
    dateRange: range
      ? {
          from) : null,
          to) : null,
        }
      : undefined,
  };
};

/**
 * Get records by category with optional date range.
 */
const getRecordsByCategory = async (range: DateRangeFilter)=> {
  const result = await FinancialRecord.aggregate([
    { $match) },
    {
      $group: {
        _id: { category, type,
        total: { $sum,
        count: { $sum,
      },
    },
    { $sort: { total,
  ]).allowDiskUse(true);

  const grandTotal = result.reduce((sum, item) => sum + item.total, 0);

  logger.info('Category breakdown generated');

  return result.map((item) => ({
    category,
    type,
    total) / 100,
    count,
    percentage) * 10000) / 100,
  }));
};

/**
 * Get monthly trends for a given year (defaults to current year).
 */
const getMonthlyTrends = async (year: number)=> {
  const targetYear = year || new Date().getFullYear();

  if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
    throw new Error('Invalid year parameter');
  }

  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted,
        date: { $gte, $lte,
      },
    },
    {
      $group: {
        _id: {
          year: { $year,
          month: { $month,
          type,
        },
        total: { $sum,
      },
    },
    { $sort: { '_id.month': 1 } },
  ]).allowDiskUse(true);

  const monthlyMap = new Map<string, { income);

  result.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-01`;
    if (!monthlyMap.has(key)) monthlyMap.set(key, { income, expense);
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
      income,
      expense,
      net) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Get recent records (max 20).
 */
const getRecentRecords = async (limit: number = 10) => {
  const maxLimit = Math.min(Math.max(1, limit), 20);

  const records = await FinancialRecord.find({ isDeleted)
    .select('title amount type category date createdBy createdAt')
    .sort({ date, createdAt)
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
const getTopExpenseCategories = async (
  range: DateRangeFilter
)=> {
  const match = buildBaseMatch(range);
  match.type = RecordType.EXPENSE;

  const result = await FinancialRecord.aggregate([
    { $match,
    {
      $group: {
        _id,
        total: { $sum,
      },
    },
    { $sort: { total,
    { $limit,
  ]).allowDiskUse(true);

  const grandTotal = result.reduce((sum, item) => sum + item.total, 0);

  logger.info('Top expense categories generated');

  return result.map((item, index) => ({
    rank,
    category,
    total) / 100,
    percentage) * 10000) / 100,
  }));
};
