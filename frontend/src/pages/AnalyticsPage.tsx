import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { getCategoryBreakdown, getMonthlyTrends } from '@/api/dashboard.api';
import { queryKeys } from '@/api/queryClient';
import { useAuthStore } from '@/store/auth.store';
import { Suspense, lazy } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface CategoryData {
  category: string;
  total: number;
  type: 'INCOME' | 'EXPENSE';
  count: number;
}

// Lazy load chart components for better performance
const LazyBarChart = lazy(() => import('@/components/charts/LazyBarChart'));

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const isAnalystOrAdmin = user?.role === 'ANALYST' || user?.role === 'ADMIN';

  // Fetch analytics data
  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: queryKeys.dashboard.categories(),
    queryFn: getCategoryBreakdown,
    enabled: isAnalystOrAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useQuery({
    queryKey: queryKeys.dashboard.trends(),
    queryFn: getMonthlyTrends,
    enabled: isAnalystOrAdmin,
    staleTime: 30 * 60 * 1000, // 30 minutes - changes at most once per month
  });

  if (!isAnalystOrAdmin) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Insights and trends" />
        <div className="card">
          <div className="text-center py-12">
            <PieChart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Access Restricted
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Analytics are only available for Analyst and Admin roles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const categories = Array.isArray(categoryData?.data) ? categoryData.data : [];
  const trends = Array.isArray(trendsData?.data) ? trendsData.data : [];

  // Calculate totals
  const totalIncome = categories
    .filter((c: any) => c.type === 'INCOME')
    .reduce((sum: number, c: any) => sum + c.total, 0);
  
  const totalExpense = categories
    .filter((c: any) => c.type === 'EXPENSE')
    .reduce((sum: number, c: any) => sum + c.total, 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

  // Get top categories
  const topIncomeCategories = categories
    .filter((c: any) => c.type === 'INCOME')
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  const topExpenseCategories = categories
    .filter((c: any) => c.type === 'EXPENSE')
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  // Calculate percentages for visual bars
  const maxIncome = topIncomeCategories[0]?.total || 1;
  const maxExpense = topExpenseCategories[0]?.total || 1;

  // Colors for pie chart segments
  const incomeColors = [
    'bg-emerald-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
  ];

  const expenseColors = [
    'bg-rose-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
  ];

  const isLoading = categoryLoading || trendsLoading;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Insights and trends" />
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (categoryError || trendsError) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Insights and trends" />
        <div className="card">
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Unable to Load Analytics
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {(categoryError as any)?.response?.data?.message || 
               (trendsError as any)?.response?.data?.message || 
               'Please try again later'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render donut chart (CSS-based)
  const renderDonutChart = (data: CategoryData[], colors: string[], type: 'income' | 'expense') => {
    const total = data.reduce((sum, item) => sum + item.total, 0);
    if (total === 0) return null;

    let cumulativePercent = 0;

    return (
      <div className="relative w-48 h-48 mx-auto">
        {/* Donut segments */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            className="text-slate-100 dark:text-slate-800"
          />
          {data.map((item, index) => {
            const percent = (item.total / total) * 100;
            const strokeDasharray = `${percent * 2.51} ${251 - percent * 2.51}`;
            const strokeDashoffset = -cumulativePercent * 2.51;
            cumulativePercent += percent;

            const colorMap: any = {
              'bg-emerald-500': '#10b981',
              'bg-green-500': '#22c55e',
              'bg-teal-500': '#14b8a6',
              'bg-cyan-500': '#06b6d4',
              'bg-sky-500': '#0ea5e9',
              'bg-rose-500': '#f43f5e',
              'bg-red-500': '#ef4444',
              'bg-orange-500': '#f97316',
              'bg-amber-500': '#f59e0b',
              'bg-yellow-500': '#eab308',
            };

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={colorMap[colors[index % colors.length]]}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(total)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total {type}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Insights and trends" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 cv-auto">
        {/* Total Income */}
        <div className="card bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 border-success-200 dark:border-success-800">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-success-500 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="px-2 py-1 bg-success-200 dark:bg-success-800 text-success-700 dark:text-success-300 text-xs font-medium rounded-full">
              Income
            </span>
          </div>
          <p className="text-sm font-medium text-success-700 dark:text-success-300 mb-1">
            Total Income
          </p>
          <p className="text-3xl font-bold text-success-900 dark:text-success-100">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="card bg-gradient-to-br from-danger-50 to-danger-100 dark:from-danger-900/20 dark:to-danger-800/20 border-danger-200 dark:border-danger-800">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-danger-500 rounded-xl shadow-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <span className="px-2 py-1 bg-danger-200 dark:bg-danger-800 text-danger-700 dark:text-danger-300 text-xs font-medium rounded-full">
              Expense
            </span>
          </div>
          <p className="text-sm font-medium text-danger-700 dark:text-danger-300 mb-1">
            Total Expenses
          </p>
          <p className="text-3xl font-bold text-danger-900 dark:text-danger-100">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        {/* Net Balance */}
        <div className={`card bg-gradient-to-br ${
          netBalance >= 0
            ? 'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800'
            : 'from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 border-warning-200 dark:border-warning-800'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl shadow-lg ${
              netBalance >= 0 ? 'bg-primary-500' : 'bg-warning-500'
            }`}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              netBalance >= 0
                ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                : 'bg-warning-200 dark:bg-warning-800 text-warning-700 dark:text-warning-300'
            }`}>
              {netBalance >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <p className={`text-sm font-medium mb-1 ${
            netBalance >= 0
              ? 'text-primary-700 dark:text-primary-300'
              : 'text-warning-700 dark:text-warning-300'
          }`}>
            Net Balance
          </p>
          <p className={`text-3xl font-bold ${
            netBalance >= 0
              ? 'text-primary-900 dark:text-primary-100'
              : 'text-warning-900 dark:text-warning-100'
          }`}>
            {netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netBalance))}
          </p>
        </div>

        {/* Savings Rate */}
        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-indigo-500 rounded-xl shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="px-2 py-1 bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
              Rate
            </span>
          </div>
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
            Savings Rate
          </p>
          <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income Distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-success-600" />
            <h3 className="text-lg font-semibold">Income Distribution</h3>
          </div>

          {topIncomeCategories.length === 0 ? (
            <p className="text-center py-12 text-slate-600 dark:text-slate-400">
              No income data available
            </p>
          ) : (
            <div>
              {renderDonutChart(topIncomeCategories, incomeColors, 'income')}
              
              <div className="mt-6 space-y-2">
                {topIncomeCategories.map((category: any, index: number) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${incomeColors[index % incomeColors.length]}`} />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {category.category}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(category.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expense Distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-danger-600" />
            <h3 className="text-lg font-semibold">Expense Distribution</h3>
          </div>

          {topExpenseCategories.length === 0 ? (
            <p className="text-center py-12 text-slate-600 dark:text-slate-400">
              No expense data available
            </p>
          ) : (
            <div>
              {renderDonutChart(topExpenseCategories, expenseColors, 'expense')}
              
              <div className="mt-6 space-y-2">
                {topExpenseCategories.map((category: any, index: number) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${expenseColors[index % expenseColors.length]}`} />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {category.category}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(category.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      {trends.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold">Monthly Trends</h3>
          </div>

          <div className="space-y-6">
            {trends.slice(0, 6).map((trend: any) => {
              const monthIncome = trend.income || 0;
              const monthExpense = trend.expense || 0;
              const monthNet = monthIncome - monthExpense;
              const maxAmount = Math.max(monthIncome, monthExpense, 1);

              return (
                <div key={trend.month} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {(() => {
                          try {
                            return new Date(trend.month + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            });
                          } catch {
                            return trend.month || 'Unknown';
                          }
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-4 h-4 text-success-600" />
                        <span className="text-sm font-semibold text-success-600">
                          {formatCurrency(monthIncome)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowDownRight className="w-4 h-4 text-danger-600" />
                        <span className="text-sm font-semibold text-danger-600">
                          {formatCurrency(monthExpense)}
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        monthNet >= 0
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                      }`}>
                        {monthNet >= 0 ? '+' : ''}{formatCurrency(monthNet)}
                      </div>
                    </div>
                  </div>

                  {/* Visual bars */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-success-600 w-16">Income</span>
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-success-500 to-success-600 rounded-full transition-all duration-500 shadow-lg"
                          style={{ width: `${(monthIncome / maxAmount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 w-12 text-right">
                        {((monthIncome / maxAmount) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-danger-600 w-16">Expense</span>
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-danger-500 to-danger-600 rounded-full transition-all duration-500 shadow-lg"
                          style={{ width: `${(monthExpense / maxAmount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 w-12 text-right">
                        {((monthExpense / maxAmount) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Income Categories */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-success-600" />
            <h3 className="text-lg font-semibold">Top Income Sources</h3>
          </div>

          {topIncomeCategories.length === 0 ? (
            <p className="text-center py-8 text-slate-600 dark:text-slate-400">
              No income data available
            </p>
          ) : (
            <div className="space-y-4">
              {topIncomeCategories.map((category: any, index: number) => {
                const percentage = (category.total / maxIncome) * 100;
                return (
                  <div key={category.category} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${incomeColors[index % incomeColors.length]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                          {index + 1}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {category.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success-600 text-lg">
                          {formatCurrency(category.total)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {category.count} transaction{category.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${incomeColors[index % incomeColors.length]} rounded-full transition-all duration-500 shadow-inner`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Expense Categories */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-danger-600" />
            <h3 className="text-lg font-semibold">Top Expense Categories</h3>
          </div>

          {topExpenseCategories.length === 0 ? (
            <p className="text-center py-8 text-slate-600 dark:text-slate-400">
              No expense data available
            </p>
          ) : (
            <div className="space-y-4">
              {topExpenseCategories.map((category: any, index: number) => {
                const percentage = (category.total / maxExpense) * 100;
                return (
                  <div key={category.category} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${expenseColors[index % expenseColors.length]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                          {index + 1}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {category.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-danger-600 text-lg">
                          {formatCurrency(category.total)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {category.count} transaction{category.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${expenseColors[index % expenseColors.length]} rounded-full transition-all duration-500 shadow-inner`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
