"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopExpenseCategories = exports.getRecentRecords = exports.getMonthlyTrends = exports.getRecordsByCategory = exports.getDashboardSummary = void 0;
const record_model_1 = require("../modules/records/record.model");
const logger_1 = require("../utils/logger");
const mongoose_1 = require("mongoose");
/**
 * Build a Mongoose $match stage that respects an optional date range and userId filter.
 * Used across all aggregations for consistency.
 */
const buildBaseMatch = (range, targetUserId) => {
    const match = { isDeleted: false };
    // Add userId filter if provided
    if (targetUserId) {
        match.userId = new mongoose_1.Types.ObjectId(targetUserId);
    }
    if (range?.from || range?.to) {
        const dateFilter = {};
        if (range.from)
            dateFilter.$gte = range.from;
        if (range.to)
            dateFilter.$lte = range.to;
        match.date = dateFilter;
    }
    return match;
};
/**
 * Get dashboard summary with RBAC
 * - Admin with no targetUserId: aggregate stats across ALL users
 * - Admin with targetUserId: stats for that specific user
 * - Analyst with targetUserId: stats for that specific user (read only)
 * - User: always stats for their own userId
 */
const getDashboardSummary = async (requestingUserRole, targetUserId, range) => {
    // Build match filter based on role and targetUserId
    const match = buildBaseMatch(range, targetUserId);
    const result = await record_model_1.FinancialRecord.aggregate([
        { $match: match },
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
    byType.forEach((item) => {
        if (item._id === record_model_1.RecordType.INCOME) {
            totalIncome = Math.round(item.total * 100) / 100;
            incomeCount = item.count;
        }
        else if (item._id === record_model_1.RecordType.EXPENSE) {
            totalExpense = Math.round(item.total * 100) / 100;
            expenseCount = item.count;
        }
    });
    logger_1.logger.info(`Dashboard summary generated for role: ${requestingUserRole}, targetUserId: ${targetUserId || 'all'}`);
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
exports.getDashboardSummary = getDashboardSummary;
/**
 * Get records by category with optional date range and userId filter.
 */
const getRecordsByCategory = async (requestingUserRole, targetUserId, range) => {
    const match = buildBaseMatch(range, targetUserId);
    const result = await record_model_1.FinancialRecord.aggregate([
        { $match: match },
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
    logger_1.logger.info('Category breakdown generated');
    return result.map((item) => ({
        category: item._id.category,
        type: item._id.type,
        total: Math.round(item.total * 100) / 100,
        count: item.count,
        percentage: grandTotal > 0 ? Math.round((item.total / grandTotal) * 10000) / 100 : 0,
    }));
};
exports.getRecordsByCategory = getRecordsByCategory;
/**
 * Get monthly trends for a given year with userId filter.
 */
const getMonthlyTrends = async (requestingUserRole, targetUserId, year) => {
    const targetYear = year || new Date().getFullYear();
    if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
        throw new Error('Invalid year parameter');
    }
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    const match = {
        isDeleted: false,
        date: { $gte: startDate, $lte: endDate },
    };
    if (targetUserId) {
        match.userId = new mongoose_1.Types.ObjectId(targetUserId);
    }
    const result = await record_model_1.FinancialRecord.aggregate([
        { $match: match },
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
    const monthlyMap = new Map();
    result.forEach((item) => {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-01`;
        if (!monthlyMap.has(key))
            monthlyMap.set(key, { income: 0, expense: 0 });
        const d = monthlyMap.get(key);
        if (item._id.type === record_model_1.RecordType.INCOME) {
            d.income = Math.round(item.total * 100) / 100;
        }
        else {
            d.expense = Math.round(item.total * 100) / 100;
        }
    });
    logger_1.logger.info(`Monthly trends generated for ${targetYear}`);
    return Array.from(monthlyMap.entries())
        .map(([month, d]) => ({
        month,
        income: d.income,
        expense: d.expense,
        net: Math.round((d.income - d.expense) * 100) / 100,
    }))
        .sort((a, b) => a.month.localeCompare(b.month));
};
exports.getMonthlyTrends = getMonthlyTrends;
/**
 * Get recent records with userId filter (max 20).
 */
const getRecentRecords = async (requestingUserRole, targetUserId, limit = 10) => {
    const maxLimit = Math.min(Math.max(1, limit), 20);
    const query = { isDeleted: false };
    if (targetUserId) {
        query.userId = new mongoose_1.Types.ObjectId(targetUserId);
    }
    const records = await record_model_1.FinancialRecord.find(query)
        .select('title amount type category date createdBy userId createdAt')
        .sort({ date: -1, createdAt: -1 })
        .limit(maxLimit)
        .populate('createdBy', 'name email')
        .populate('userId', 'name email')
        .lean()
        .exec();
    logger_1.logger.info(`Recent records retrieved (limit: ${maxLimit})`);
    return records;
};
exports.getRecentRecords = getRecentRecords;
/**
 * Get top 5 expense categories with optional date range and userId filter.
 */
const getTopExpenseCategories = async (requestingUserRole, targetUserId, range) => {
    const match = buildBaseMatch(range, targetUserId);
    match.type = record_model_1.RecordType.EXPENSE;
    const result = await record_model_1.FinancialRecord.aggregate([
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
    logger_1.logger.info('Top expense categories generated');
    return result.map((item, index) => ({
        rank: index + 1,
        category: item._id,
        total: Math.round(item.total * 100) / 100,
        percentage: grandTotal > 0 ? Math.round((item.total / grandTotal) * 10000) / 100 : 0,
    }));
};
exports.getTopExpenseCategories = getTopExpenseCategories;
