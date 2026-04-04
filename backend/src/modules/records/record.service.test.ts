import mongoose from 'mongoose';
import { FinancialRecord, RecordType } from './record.model';
import { User } from '../users/user.model';
import * as recordService from './record.service';
import { NotFoundError } from '../../middleware/errorHandler';

describe('Record Service', () => {
  let testUserId: string;
  let testRecordId: string;

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

    // Create test record
    const record = await FinancialRecord.create({
      title: 'Test Income',
      amount: 1000,
      type: RecordType.INCOME,
      category: 'Salary',
      date: new Date('2026-01-15'),
      notes: 'Test notes',
      createdBy: testUserId,
      lastModifiedBy: testUserId,
    });
    testRecordId = record._id.toString();
  });

  describe('createRecord', () => {
    it('should create a new record', async () => {
      const data = {
        title: 'New Income',
        amount: 2000,
        type: RecordType.INCOME,
        category: 'Bonus',
        date: '2026-02-01',
        notes: 'Bonus payment',
      };

      const record = await recordService.createRecord(data, testUserId);

      expect(record).toBeTruthy();
      expect(record.title).toBe(data.title);
      expect(record.amount).toBe(data.amount);
      expect(record.type).toBe(data.type);
      expect(record.category).toBe(data.category);
      expect(record.createdBy.toString()).toBe(testUserId);
      expect(record.lastModifiedBy?.toString()).toBe(testUserId);
    });

    it('should create expense record', async () => {
      const data = {
        title: 'Rent Payment',
        amount: 1500,
        type: RecordType.EXPENSE,
        category: 'Housing',
        date: '2026-02-01',
      };

      const record = await recordService.createRecord(data, testUserId);

      expect(record.type).toBe(RecordType.EXPENSE);
      expect(record.amount).toBe(1500);
    });

    it('should handle optional notes field', async () => {
      const data = {
        title: 'Quick Entry',
        amount: 100,
        type: RecordType.INCOME,
        category: 'Other',
        date: new Date().toISOString(),
      };

      const record = await recordService.createRecord(data, testUserId);

      expect(record.notes).toBeUndefined();
    });
  });

  describe('getAllRecords', () => {
    beforeEach(async () => {
      // Create multiple test records
      await FinancialRecord.create([
        {
          title: 'Salary January',
          amount: 5000,
          type: RecordType.INCOME,
          category: 'Salary',
          date: new Date('2026-01-01'),
          createdBy: testUserId,
          lastModifiedBy: testUserId,
        },
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
          title: 'Groceries',
          amount: 300,
          type: RecordType.EXPENSE,
          category: 'Food',
          date: new Date('2026-01-10'),
          notes: 'Weekly shopping',
          createdBy: testUserId,
          lastModifiedBy: testUserId,
        },
      ]);
    });

    it('should return paginated records', async () => {
      const result = await recordService.getAllRecords({
        page: 1,
        limit: 10,
      });

      expect(result.data).toBeTruthy();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.meta).toBeTruthy();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter by type', async () => {
      const result = await recordService.getAllRecords({
        type: RecordType.INCOME,
        page: 1,
        limit: 10,
      });

      expect(result.data.every(r => r.type === RecordType.INCOME)).toBe(true);
    });

    it('should filter by category', async () => {
      const result = await recordService.getAllRecords({
        category: 'Salary',
        page: 1,
        limit: 10,
      });

      expect(result.data.every(r => r.category.toLowerCase().includes('salary'))).toBe(true);
    });

    it('should filter by date range', async () => {
      const result = await recordService.getAllRecords({
        from: '2026-01-01',
        to: '2026-01-05',
        page: 1,
        limit: 10,
      });

      result.data.forEach(record => {
        const recordDate = new Date(record.date);
        expect(recordDate >= new Date('2026-01-01')).toBe(true);
        expect(recordDate <= new Date('2026-01-05')).toBe(true);
      });
    });

    it('should search across title, notes, and category', async () => {
      const result = await recordService.getAllRecords({
        search: 'Groceries',
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(r => r.title.includes('Groceries'))).toBe(true);
    });

    it('should search in notes field', async () => {
      const result = await recordService.getAllRecords({
        search: 'shopping',
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should sort by date descending by default', async () => {
      const result = await recordService.getAllRecords({
        page: 1,
        limit: 10,
      });

      for (let i = 0; i < result.data.length - 1; i++) {
        const current = new Date(result.data[i].date);
        const next = new Date(result.data[i + 1].date);
        expect(current >= next).toBe(true);
      }
    });

    it('should sort by amount ascending', async () => {
      const result = await recordService.getAllRecords({
        page: 1,
        limit: 10,
        sortBy: 'amount',
        order: 'asc',
      });

      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].amount <= result.data[i + 1].amount).toBe(true);
      }
    });

    it('should exclude soft-deleted records', async () => {
      await FinancialRecord.updateOne(
        { _id: testRecordId },
        { isDeleted: true, deletedAt: new Date() }
      );

      const result = await recordService.getAllRecords({
        page: 1,
        limit: 10,
      });

      expect(result.data.every(r => r._id.toString() !== testRecordId)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await recordService.getAllRecords({
        page: 1,
        limit: 2,
      });

      const page2 = await recordService.getAllRecords({
        page: 2,
        limit: 2,
      });

      expect(page1.data.length).toBeLessThanOrEqual(2);
      expect(page2.data.length).toBeLessThanOrEqual(2);
      // Check that there are more pages if we have more than 2 records
      if (page1.meta.totalCount > 2) {
        expect(page1.meta.totalPages).toBeGreaterThan(1);
      }
    });

    it('should combine multiple filters', async () => {
      const result = await recordService.getAllRecords({
        type: RecordType.EXPENSE,
        from: '2026-01-01',
        to: '2026-01-31',
        search: 'Rent',
        page: 1,
        limit: 10,
      });

      result.data.forEach(record => {
        expect(record.type).toBe(RecordType.EXPENSE);
        const recordDate = new Date(record.date);
        expect(recordDate >= new Date('2026-01-01')).toBe(true);
        expect(recordDate <= new Date('2026-01-31')).toBe(true);
      });
    });
  });

  describe('getRecordById', () => {
    it('should return record by ID', async () => {
      const record = await recordService.getRecordById(testRecordId);

      expect(record).toBeTruthy();
      expect(record._id.toString()).toBe(testRecordId);
      expect(record.title).toBe('Test Income');
    });

    it('should populate createdBy field', async () => {
      const record = await recordService.getRecordById(testRecordId);

      expect(record.createdBy).toBeTruthy();
      // CreatedBy is populated with user data
      const createdBy = record.createdBy as any;
      if (createdBy.email) {
        expect(createdBy.email).toBe('test@example.com');
      }
    });

    it('should throw NotFoundError for non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(recordService.getRecordById(fakeId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for soft-deleted record', async () => {
      await FinancialRecord.updateOne(
        { _id: testRecordId },
        { isDeleted: true, deletedAt: new Date() }
      );

      await expect(recordService.getRecordById(testRecordId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateRecord', () => {
    it('should update record fields', async () => {
      const updates = {
        title: 'Updated Title',
        amount: 2500,
        notes: 'Updated notes',
      };

      const record = await recordService.updateRecord(testRecordId, updates, testUserId);

      expect(record.title).toBe(updates.title);
      expect(record.amount).toBe(updates.amount);
      expect(record.notes).toBe(updates.notes);
    });

    it('should update lastModifiedBy', async () => {
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        phone: '+919999999999',
        passwordHash: 'hashedpassword',
      });

      const record = await recordService.updateRecord(
        testRecordId,
        { title: 'Updated' },
        anotherUser._id.toString()
      );

      expect(record.lastModifiedBy?.toString()).toBe(anotherUser._id.toString());
    });

    it('should throw NotFoundError for non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        recordService.updateRecord(fakeId, { title: 'Updated' }, testUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for soft-deleted record', async () => {
      await FinancialRecord.updateOne(
        { _id: testRecordId },
        { isDeleted: true, deletedAt: new Date() }
      );

      await expect(
        recordService.updateRecord(testRecordId, { title: 'Updated' }, testUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should allow partial updates', async () => {
      const originalRecord = await FinancialRecord.findById(testRecordId);
      const originalAmount = originalRecord!.amount;

      await recordService.updateRecord(testRecordId, { title: 'New Title' }, testUserId);

      const updatedRecord = await FinancialRecord.findById(testRecordId);
      expect(updatedRecord!.title).toBe('New Title');
      expect(updatedRecord!.amount).toBe(originalAmount);
    });
  });

  describe('deleteRecord', () => {
    it('should soft-delete record', async () => {
      const record = await recordService.deleteRecord(testRecordId, testUserId);

      expect(record.isDeleted).toBe(true);
      expect(record.deletedAt).toBeTruthy();
    });

    it('should update lastModifiedBy on delete', async () => {
      const record = await recordService.deleteRecord(testRecordId, testUserId);

      expect(record.lastModifiedBy?.toString()).toBe(testUserId);
    });

    it('should throw NotFoundError for non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(recordService.deleteRecord(fakeId, testUserId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError for already deleted record', async () => {
      await recordService.deleteRecord(testRecordId, testUserId);

      await expect(recordService.deleteRecord(testRecordId, testUserId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should keep record in database (soft delete)', async () => {
      await recordService.deleteRecord(testRecordId, testUserId);

      const record = await FinancialRecord.findById(testRecordId);
      expect(record).toBeTruthy();
      expect(record!.isDeleted).toBe(true);
    });
  });

  describe('uploadAttachment', () => {
    it('should throw NotFoundError for non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const buffer = Buffer.from('test file content');

      await expect(recordService.uploadAttachment(fakeId, buffer)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError for soft-deleted record', async () => {
      await FinancialRecord.updateOne(
        { _id: testRecordId },
        { isDeleted: true, deletedAt: new Date() }
      );

      const buffer = Buffer.from('test file content');

      await expect(recordService.uploadAttachment(testRecordId, buffer)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
