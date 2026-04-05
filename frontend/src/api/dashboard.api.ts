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
 */
export async function getSummary(params?: { from?: string; to?: string }) {
  const response = await apiClient.get('/dashboard/summary', { params });
  return response.data;
}

/**
 * Get category breakdown
 */
export async function getCategoryBreakdown(params?: { from?: string; to?: string }) {
  const response = await apiClient.get('/dashboard/by-category', { params });
  return response.data;
}

/**
 * Get monthly trends
 */
export async function getMonthlyTrends(year?: number) {
  const response = await apiClient.get('/dashboard/trends', {
    params: { year },
  });
  return response.data;
}

/**
 * Get recent transactions
 */
export async function getRecentTransactions(limit: number = 10) {
  const response = await apiClient.get('/dashboard/recent', {
    params: { limit },
  });
  return response.data;
}
