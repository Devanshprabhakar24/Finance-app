import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentTransactions } from '@/api/dashboard.api';
import { queryClient, queryKeys } from '@/api/queryClient';
import { useState, useEffect, useRef } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useAuthStore } from '@/store/auth.store';

interface FinancialRecord {
  _id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  createdBy?: {
    name: string;
  };
}



export default function DashboardPage() {
  const { user } = useAuthStore();
  const { can } = usePermission();
  const canViewAnalytics = can('view:analytics');
  
  // 🔒 SECURITY: Track user ID to detect user changes and clear cache
  const previousUserIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    console.log('🔍 Dashboard - Current user:', user?._id, user?.email, user?.role);
    
    if (user?._id && previousUserIdRef.current && previousUserIdRef.current !== user._id) {
      // User changed - clear all cached data
      console.log('⚠️ User changed! Clearing cache. Old:', previousUserIdRef.current, 'New:', user._id);
      queryClient.clear();
    }
    previousUserIdRef.current = user?._id || null;
  }, [user?._id]);

  // Date range state
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Fetch dashboard data with date range
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.dashboard.summary(fromDate ? new Date(fromDate).getFullYear() : undefined),
    queryFn: () => getSummary({ from: fromDate || undefined, to: toDate || undefined }),
    staleTime: 5 * 60 * 1000, // 5 minutes - changes only after record mutations
  });

  // Only fetch analytics data for ANALYST and ADMIN
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: queryKeys.dashboard.categories(fromDate ? new Date(fromDate).getFullYear() : undefined),
    queryFn: () => getCategoryBreakdown({ from: fromDate || undefined, to: toDate || undefined }),
    enabled: canViewAnalytics,
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: queryKeys.dashboard.trends(),
    queryFn: () => getMonthlyTrends(),
    enabled: canViewAnalytics,
    staleTime: 30 * 60 * 1000, // 30 minutes - changes at most once per month
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: queryKeys.dashboard.recent(),
    queryFn: () => getRecentTransactions(5),
    staleTime: 60 * 1000, // 1 minute - admin may create records
  });

  const summary = summaryData?.data || {
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    incomeCount: 0,
    expenseCount: 0,
  };

  const categories = categoryData?.data || [];
  const trends = trendsData?.data || [];
  const recentRecords = recentData?.data || [];

  // Get last 6 months for chart
  const last6Months = trends.slice(-6);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your finances" />

      {/* Date Range Filter */}
      <div className="mt-6 card">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input-field"
              max={toDate || new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input-field"
              min={fromDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        {(fromDate || toDate) && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Showing data {fromDate && `from ${new Date(fromDate).toLocaleDateString()}`} {toDate && `to ${new Date(toDate).toLocaleDateString()}`}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 cv-auto">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Income</h3>
              <p className="text-3xl font-bold text-success-600 dark:text-success-400 mt-2">
                {summaryLoading ? '...' : formatCurrency(summary.totalIncome)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {summary.incomeCount} transactions
              </p>
            </div>
            <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Expense</h3>
              <p className="text-3xl font-bold text-danger-600 dark:text-danger-400 mt-2">
                {summaryLoading ? '...' : formatCurrency(summary.totalExpense)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {summary.expenseCount} transactions
              </p>
            </div>
            <div className="p-3 bg-danger-100 dark:bg-danger-900/30 rounded-lg">
              <TrendingDown className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Net Balance</h3>
              <p className={`text-3xl font-bold mt-2 ${
                summary.netBalance >= 0 
                  ? 'text-success-600 dark:text-success-400' 
                  : 'text-danger-600 dark:text-danger-400'
              }`}>
                {summaryLoading ? '...' : formatCurrency(summary.netBalance)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Income - Expense
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Records</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {summaryLoading ? '...' : (summary.incomeCount + summary.expenseCount)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                All transactions
              </p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Activity className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section - Only for ANALYST and ADMIN */}
      {canViewAnalytics && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 cv-auto">
          {/* Monthly Trends */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold">Monthly Trends</h3>
            </div>
            {trendsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : last6Months.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-12">No trend data available</p>
            ) : (
              <div className="space-y-3">
                {last6Months.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium">{trend.month} {trend.year}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Net: {formatCurrency(trend.net)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-success-600 dark:text-success-400">
                        ↑ {formatCurrency(trend.income)}
                      </p>
                      <p className="text-sm text-danger-600 dark:text-danger-400">
                        ↓ {formatCurrency(trend.expense)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Categories */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold">Top Categories</h3>
            </div>
            {categoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-12">No category data available</p>
            ) : (
              <div className="space-y-3">
                {categories.slice(0, 6).map((category, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.category}</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatCurrency(category.total)} ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message for USER role without analytics access */}
      {!canViewAnalytics && (
        <div className="mt-6 card">
          <div className="text-center py-8">
            <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Analytics Available for Analysts
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Upgrade to Analyst or Admin role to view detailed analytics, trends, and category breakdowns.
            </p>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="mt-6 card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
          </div>
          <a href="/dashboard/records" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </a>
        </div>
        {recentLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentRecords.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-12">No recent transactions</p>
        ) : (
          <div className="space-y-3">
            {recentRecords.map((record: FinancialRecord) => (
              <div key={record._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    record.type === 'INCOME' 
                      ? 'bg-success-100 dark:bg-success-900/30' 
                      : 'bg-danger-100 dark:bg-danger-900/30'
                  }`}>
                    {record.type === 'INCOME' ? (
                      <ArrowUpRight className="w-4 h-4 text-success-600 dark:text-success-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{record.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {record.category} • {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    record.type === 'INCOME' 
                      ? 'text-success-600 dark:text-success-400' 
                      : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    by {record.createdBy?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
