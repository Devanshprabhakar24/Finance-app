export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalRecords: number;
  incomeChange?: number; // percentage change vs last period
  expenseChange?: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface RecentTransaction {
  _id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  monthlyTrends: MonthlyTrend[];
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: RecentTransaction[];
  topCategories: CategoryBreakdown[];
}

export interface DashboardResponse {
  message: string;
  data: DashboardData;
}
