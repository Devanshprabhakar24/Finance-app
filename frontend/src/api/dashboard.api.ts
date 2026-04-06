import apiClient from './axios';

/**
 * Dashboard & Analytics API calls
 */

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface CategoryData {
  category: string;
  type: 'INCOME' | 'EXPENSE';
  total: number;
  count: number;
  percentage: number;
}

export interface TrendData {
  month: string;
  year: number;
  income: number;
  expense: number;
  net: number;
}

export interface RecentRecord {
  _id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  createdBy: {
    _id: string;
    name: string;
  };
}

/**
 * Get dashboard summary statistics
 * Admin/Analyst can pass userId to view specific user's stats
 */
export async function getSummary(params?: { from?: string; to?: string; userId?: string }) {
  const response = await apiClient.get('/dashboard/summary', { params });
  return response.data;
}

/**
 * Get category breakdown
 * Admin/Analyst can pass userId to view specific user's breakdown
 */
export async function getCategoryBreakdown(params?: { from?: string; to?: string; userId?: string }) {
  const response = await apiClient.get('/dashboard/by-category', { params });
  return response.data;
}

/**
 * Get monthly trends
 * Admin/Analyst can pass userId to view specific user's trends
 */
export async function getMonthlyTrends(year?: number, userId?: string) {
  const response = await apiClient.get('/dashboard/trends', {
    params: { year, userId },
  });
  return response.data;
}

/**
 * Get recent transactions
 * Admin/Analyst can pass userId to view specific user's transactions
 */
export async function getRecentTransactions(limit: number = 10, userId?: string) {
  const response = await apiClient.get('/dashboard/recent', {
    params: { limit, userId },
  });
  return response.data;
}
