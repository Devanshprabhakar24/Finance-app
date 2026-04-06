import mongoose from 'mongoose';
import { FinancialRecord, RecordType } from '../src/modules/records/record.model';
import { User } from '../src/modules/users/user.model';
import { logger } from '../src/utils/logger';
import { env } from '../src/config/env';

const categories = {
  INCOME: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Gift'],
  EXPENSE: ['Rent', 'Food', 'Transport', 'Utilities', 'Healthcare', 'Entertainment'],
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randAmount = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

async function seedTestData() {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info('✅ Connected to database');

    // Get all users
    const users = await User.find().select('_id name email role').lean();
    logger.info(`Found ${users.length} users`);

    const currentYear = new Date().getFullYear();
    let totalCreated = 0;

    // Create records for each user
    for (const user of users) {
      logger.info(`\nCreating records for ${user.name} (${user.email})...`);
      
      const records = [];
      const numRecords = Math.floor(Math.random() * 10) + 5; // 5-15 records per user

      for (let i = 0; i < numRecords; i++) {
        const type = Math.random() > 0.4 ? RecordType.EXPENSE : RecordType.INCOME;
        const category = pick(categories[type]);
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(currentYear, month, day);
        const range = type === RecordType.INCOME
          ? { min: 1000, max: 10000 }
          : { min: 100, max: 3000 };

        records.push({
          title: `${category} - ${date.toLocaleDateString('en-US', { month: 'short' })}`,
          amount: randAmount(range.min, range.max),
          type,
          category,
          date,
          notes: `Test record for ${user.name}`,
          userId: user._id,
          createdBy: user._id,
          lastModifiedBy: user._id,
          isDeleted: false,
        });
      }

      await FinancialRecord.insertMany(records);
      
      const income = records.filter(r => r.type === RecordType.INCOME);
      const expense = records.filter(r => r.type === RecordType.EXPENSE);
      const totalIncome = income.reduce((s, r) => s + r.amount, 0);
      const totalExpense = expense.reduce((s, r) => s + r.amount, 0);

      logger.info(`  ✅ Created ${records.length} records`);
      logger.info(`     Income: ${income.length} records, ₹${totalIncome.toFixed(2)}`);
      logger.info(`     Expense: ${expense.length} records, ₹${totalExpense.toFixed(2)}`);
      logger.info(`     Net: ₹${(totalIncome - totalExpense).toFixed(2)}`);

      totalCreated += records.length;
    }

    logger.info(`\n✅ Total records created: ${totalCreated}`);
    logger.info('\n🎉 Test data seeded successfully!');
    logger.info('\nYou can now login as different users and see different data:');
    users.forEach(user => {
      logger.info(`  - ${user.email} (${user.role})`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedTestData();
