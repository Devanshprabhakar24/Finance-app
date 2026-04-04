import { FinancialRecord, RecordType } from '../modules/records/record.model';
import { User } from '../modules/users/user.model';
import * as dashboardService from './dashboard.service';

describe('Dashboard Service', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+911234567890',
      passwordHash: 'hashedpassword',
      isVerified: true,
    });
    testUserId = user._id.toString();

    // Create test records for 2026
    await FinancialRecord.create([
      // January Income
      {
        title: 'Salary January',
        amount: 5000,
        type: RecordType.INCOME,
        category: 'Salary',
        date: new Date('2026-01-15'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      },
      {
        title: 'Freelance January',
        amount: 1000,
        type: RecordType.INCOME,
        category: 'Freelance',
        date: new Date('2026-01-20'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      },
      // January Expenses
      {
        title: 'Rent January',
        amount: 1500,
        type: RecordType.EXPENSE,
        category: 'Housing',
        date: new Date('2026-01-05'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      },
      {
        title: 'Groceries January',
        amount: 300,
        type: RecordType.EXPENSE,
        category: 'Food',
        date: new Date('2026-01-10'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      },
      {
        title: 'Utilities January',
        amount: 200,
        type: RecordType.EXPENSE,
        category: 'Utilities',
        date: new Date('2026-01-12'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      },
      // February Income
      {
        title: 'Salary February',
        amount: 5000,
        type: RecordType.INCOME,
        category: 'Salary',
        date: new Date('2026-02-15'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      },
      // February Expenses
      {
        title: 'Rent February',
        amount: 1500,
        type: RecordType.EXPENSE,
        category: 'Housing',
        date: new Date('2026-02-05'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      },
      {
        title: 'Groceries February',
        amount: 350,
        type: RecordType.EXPENSE,
        category: 'Food',
        date: new Date('2026-02-10'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      },
    ]);
  });

  describe('getDashboardSummary', () => {
    it('should return summary with correct totals', async () => {
      const summary = await dashboardService.getDashboardSummary();

      expect(summary.totalIncome).toBe(11000); // 5000 + 1000 + 5000
      expect(summary.totalExpense).toBe(3850); // 1500 + 300 + 200 + 1500 + 350
      expect(summary.netBalance).toBe(7150); // 11000 - 3850
    });

    it('should return correct record counts', async () => {
      const summary = await dashboardService.getDashboardSummary();

      expect(summary.incomeCount).toBe(3);
      expect(summary.expenseCount).toBe(5);
      expect(summary.recordCount).toBe(8);
    });

    it('should filter by date range', async () => {
      const summary = await dashboardService.getDashboardSummary({
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      });

      expect(summary.totalIncome).toBe(6000); // January only
      expect(summary.totalExpense).toBe(2000); // January only
      expect(summary.netBalance).toBe(4000);
      expect(summary.incomeCount).toBe(2);
      expect(summary.expenseCount).toBe(3);
    });

    it('should include date range in response when filtered', async () => {
      const summary = await dashboardService.getDashboardSummary({
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      });

      expect(summary.dateRange).toBeTruthy();
      expect(summary.dateRange?.from).toBeTruthy();
      expect(summary.dateRange?.to).toBeTruthy();
    });

    it('should handle no records', async () => {
      await FinancialRecord.deleteMany({});

      const summary = await dashboardService.getDashboardSummary();

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(0);
      expect(summary.netBalance).toBe(0);
      expect(summary.recordCount).toBe(0);
    });

    it('should exclude soft-deleted records', async () => {
      await FinancialRecord.updateMany(
        { category: 'Salary' },
        { isDeleted: true, deletedAt: new Date() }
      );

      const summary = await dashboardService.getDashboardSummary();

      expect(summary.totalIncome).toBe(1000); // Only Freelance
      expect(summary.incomeCount).toBe(1);
    });

    it('should handle only income records', async () => {
      await FinancialRecord.deleteMany({ type: RecordType.EXPENSE });

      const summary = await dashboardService.getDashboardSummary();

      expect(summary.totalIncome).toBe(11000);
      expect(summary.totalExpense).toBe(0);
      expect(summary.netBalance).toBe(11000);
      expect(summary.expenseCount).toBe(0);
    });

    it('should handle only expense records', async () => {
      await FinancialRecord.deleteMany({ type: RecordType.INCOME });

      const summary = await dashboardService.getDashboardSummary();

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(3850);
      expect(summary.netBalance).toBe(-3850);
      expect(summary.incomeCount).toBe(0);
    });

    it('should round amounts to 2 decimal places', async () => {
      await FinancialRecord.create({
        title: 'Test',
        amount: 123.456,
        type: RecordType.INCOME,
        category: 'Test',
        date: new Date('2026-01-01'),
        createdBy: testUserId,
        lastModifiedBy: testUserId,
      });

      const summary = await dashboardService.getDashboardSummary();

      // Check that amounts are rounded to 2 decimal places
      expect(Number.isInteger(summary.totalIncome * 100)).toBe(true);
      expect(Number.isInteger(summary.totalExpense * 100)).toBe(true);
      expect(Number.isInteger(summary.netBalance * 100)).toBe(true);
    });
  });

  describe('getRecordsByCategory', () => {
    it('should return category breakdown', async () => {
      const categories = await dashboardService.getRecordsByCategory();

      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('category');
      expect(categories[0]).toHaveProperty('type');
      expect(categories[0]).toHaveProperty('total');
      expect(categories[0]).toHaveProperty('count');
      expect(categories[0]).toHaveProperty('percentage');
    });

    it('should sort by total descending', async () => {
      const categories = await dashboardService.getRecordsByCategory();

      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i].total >= categories[i + 1].total).toBe(true);
      }
    });

    it('should calculate percentages correctly', async () => {
      const categories = await dashboardService.getRecordsByCategory();

      const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
      expect(Math.abs(totalPercentage - 100)).toBeLessThan(1); // Allow small rounding error
    });

    it('should filter by date range', async () => {
      const categories = await dashboardService.getRecordsByCategory({
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      });

      const salaryCategory = categories.find(c => c.category === 'Salary');
      expect(salaryCategory?.total).toBe(5000); // Only January salary
    });

    it('should group by category and type', async () => {
      const categories = await dashboardService.getRecordsByCategory();

      const housingExpense = categories.find(
        c => c.category === 'Housing' && c.type === RecordType.EXPENSE
      );
      expect(housingExpense).toBeTruthy();
      expect(housingExpense?.total).toBe(3000); // 1500 + 1500
      expect(housingExpense?.count).toBe(2);
    });

    it('should exclude soft-deleted records', async () => {
      await FinancialRecord.updateMany(
        { category: 'Food' },
        { isDeleted: true, deletedAt: new Date() }
      );

      const categories = await dashboardService.getRecordsByCategory();

      const foodCategory = categories.find(c => c.category === 'Food');
      expect(foodCategory).toBeFalsy();
    });

    it('should handle no records', async () => {
      await FinancialRecord.deleteMany({});

      const categories = await dashboardService.getRecordsByCategory();

      expect(categories).toEqual([]);
    });
  });

  describe('getMonthlyTrends', () => {
    it('should return monthly trends for specified year', async () => {
      const trends = await dashboardService.getMonthlyTrends(2026);

      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0]).toHaveProperty('month');
      expect(trends[0]).toHaveProperty('income');
      expect(trends[0]).toHaveProperty('expense');
      expect(trends[0]).toHaveProperty('net');
    });

    it('should calculate net correctly', async () => {
      const trends = await dashboardService.getMonthlyTrends(2026);

      trends.forEach(trend => {
        expect(trend.net).toBe(
          Math.round((trend.income - trend.expense) * 100) / 100
        );
      });
    });

    it('should sort by month ascending', async () => {
      const trends = await dashboardService.getMonthlyTrends(2026);

      for (let i = 0; i < trends.length - 1; i++) {
        expect(trends[i].month <= trends[i + 1].month).toBe(true);
      }
    });

    it('should use current year by default', async () => {
      const trends = await dashboardService.getMonthlyTrends();

      expect(trends).toBeTruthy();
    });

    it('should throw error for invalid year', async () => {
      await expect(dashboardService.getMonthlyTrends(1999)).rejects.toThrow();
      await expect(dashboardService.getMonthlyTrends(2101)).rejects.toThrow();
    });

    it('should return empty array for year with no records', async () => {
      const trends = await dashboardService.getMonthlyTrends(2025);

      expect(trends).toEqual([]);
    });

    it('should exclude soft-deleted records', async () => {
      await FinancialRecord.updateMany(
        { date: { $gte: new Date('2026-02-01') } },
        { isDeleted: true, deletedAt: new Date() }
      );

      const trends = await dashboardService.getMonthlyTrends(2026);

      const februaryTrend = trends.find(t => t.month.startsWith('2026-02'));
      expect(februaryTrend).toBeFalsy();
    });

    it('should format month as YYYY-MM-DD', async () => {
      const trends = await dashboardService.getMonthlyTrends(2026);

      trends.forEach(trend => {
        expect(trend.month).toMatch(/^\d{4}-\d{2}-01$/);
      });
    });
  });

  describe('getRecentRecords', () => {
    it('should return recent records', async () => {
      const records = await dashboardService.getRecentRecords(5);

      expect(records.length).toBeLessThanOrEqual(5);
      expect(records[0]).toHaveProperty('title');
      expect(records[0]).toHaveProperty('amount');
      expect(records[0]).toHaveProperty('type');
      expect(records[0]).toHaveProperty('category');
    });

    it('should sort by date descending', async () => {
      const records = await dashboardService.getRecentRecords(10);

      for (let i = 0; i < records.length - 1; i++) {
        const currentDate = new Date(records[i].date);
        const nextDate = new Date(records[i + 1].date);
        expect(currentDate >= nextDate).toBe(true);
      }
    });

    it('should default to 10 records', async () => {
      const records = await dashboardService.getRecentRecords();

      expect(records.length).toBeLessThanOrEqual(10);
    });

    it('should cap at 20 records', async () => {
      const records = await dashboardService.getRecentRecords(100);

      expect(records.length).toBeLessThanOrEqual(20);
    });

    it('should exclude soft-deleted records', async () => {
      const allRecords = await FinancialRecord.find({ isDeleted: false });
      const recordToDelete = allRecords[0];

      await FinancialRecord.updateOne(
        { _id: recordToDelete._id },
        { isDeleted: true, deletedAt: new Date() }
      );

      const recentRecords = await dashboardService.getRecentRecords(10);

      expect(recentRecords.every(r => r._id.toString() !== recordToDelete._id.toString())).toBe(
        true
      );
    });

    it('should populate createdBy field', async () => {
      const records = await dashboardService.getRecentRecords(5);

      if (records.length > 0 && records[0].createdBy) {
        expect(records[0].createdBy).toHaveProperty('email');
      }
    });
  });

  describe('getTopExpenseCategories', () => {
    it('should return top 5 expense categories', async () => {
      const topCategories = await dashboardService.getTopExpenseCategories();

      expect(topCategories.length).toBeLessThanOrEqual(5);
      expect(topCategories[0]).toHaveProperty('rank');
      expect(topCategories[0]).toHaveProperty('category');
      expect(topCategories[0]).toHaveProperty('total');
      expect(topCategories[0]).toHaveProperty('percentage');
    });

    it('should sort by total descending', async () => {
      const topCategories = await dashboardService.getTopExpenseCategories();

      for (let i = 0; i < topCategories.length - 1; i++) {
        expect(topCategories[i].total >= topCategories[i + 1].total).toBe(true);
      }
    });

    it('should assign correct ranks', async () => {
      const topCategories = await dashboardService.getTopExpenseCategories();

      topCategories.forEach((cat, index) => {
        expect(cat.rank).toBe(index + 1);
      });
    });

    it('should calculate percentages correctly', async () => {
      const topCategories = await dashboardService.getTopExpenseCategories();

      const totalPercentage = topCategories.reduce((sum, cat) => sum + cat.percentage, 0);
      expect(totalPercentage).toBeLessThanOrEqual(100);
    });

    it('should filter by date range', async () => {
      const topCategories = await dashboardService.getTopExpenseCategories({
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      });

      const housingCategory = topCategories.find(c => c.category === 'Housing');
      expect(housingCategory?.total).toBe(1500); // Only January rent
    });

    it('should only include expense records', async () => {
      const topCategories = await dashboardService.getTopExpenseCategories();

      // Verify no income categories appear
      const salaryCategory = topCategories.find(c => c.category === 'Salary');
      expect(salaryCategory).toBeFalsy();
    });

    it('should exclude soft-deleted records', async () => {
      await FinancialRecord.updateMany(
        { category: 'Housing' },
        { isDeleted: true, deletedAt: new Date() }
      );

      const topCategories = await dashboardService.getTopExpenseCategories();

      const housingCategory = topCategories.find(c => c.category === 'Housing');
      expect(housingCategory).toBeFalsy();
    });

    it('should handle no expense records', async () => {
      await FinancialRecord.deleteMany({ type: RecordType.EXPENSE });

      const topCategories = await dashboardService.getTopExpenseCategories();

      expect(topCategories).toEqual([]);
    });
  });
});
