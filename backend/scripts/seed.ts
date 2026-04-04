import bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../src/modules/users/user.model';
import { FinancialRecord, RecordType } from '../src/modules/records/record.model';
import { connectDB, disconnectDB } from '../src/config/db';
import { logger } from '../src/utils/logger';
import { env } from '../src/config/env';

const categories = {
  INCOME: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Gift'],
  EXPENSE: ['Rent', 'Food', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Education'],
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randAmount = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const seedDatabase = async (force = false) => {
  try {
    await connectDB();

    const userCount = await User.countDocuments();
    if (userCount > 0 && !force) {
      logger.warn('Database already has data. Use --force to drop and reseed.');
      process.exit(0);
    }

    if (force) {
      logger.info('Dropping existing data...');
      await User.deleteMany({});
      await FinancialRecord.deleteMany({});
    }

    // ── Users ──────────────────────────────────────────────────────────────
    logger.info('Creating users...');

    const password = env.admin.password ?? 'Demo@12345';
    const passwordHash = await bcrypt.hash(password, 10);

    const users = await User.create([
      {
        name: env.admin.fullName ?? 'Admin User',
        email: env.admin.email ?? 'admin@finance.dev',
        phone: env.admin.phone ?? '+911111111111',
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isVerified: true,
      },
      {
        name: 'Analyst User',
        email: 'analyst@finance.dev',
        phone: '+912222222222',
        passwordHash,
        role: UserRole.ANALYST,
        status: UserStatus.ACTIVE,
        isVerified: true,
      },
      {
        name: 'Viewer User',
        email: 'viewer@finance.dev',
        phone: '+913333333333',
        passwordHash,
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE,
        isVerified: true,
      },
    ]);

    logger.info(`✅ Created ${users.length} users`);

    // ── Financial Records ──────────────────────────────────────────────────
    logger.info('Creating financial records...');

    const adminUser = users[0];
    const currentYear = new Date().getFullYear();
    const records = [];

    for (let month = 0; month < 12; month++) {
      const count = Math.floor(Math.random() * 5) + 3; // 3–7 per month

      for (let i = 0; i < count; i++) {
        const type = Math.random() > 0.4 ? RecordType.EXPENSE : RecordType.INCOME;
        const category = pick(categories[type]);
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(currentYear, month, day);
        const range = type === RecordType.INCOME
          ? { min: 1000, max: 50000 }
          : { min: 100, max: 5000 };

        records.push({
          title: `${category} — ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
          amount: randAmount(range.min, range.max),
          type,
          category,
          date,
          notes: Math.random() > 0.5 ? `Sample note for ${category.toLowerCase()}` : undefined,
          createdBy: adminUser._id,
          lastModifiedBy: adminUser._id,
          isDeleted: false,
        });
      }
    }

    await FinancialRecord.insertMany(records);

    const income = records.filter((r) => r.type === RecordType.INCOME);
    const expense = records.filter((r) => r.type === RecordType.EXPENSE);
    const totalIncome = income.reduce((s, r) => s + r.amount, 0);
    const totalExpense = expense.reduce((s, r) => s + r.amount, 0);

    logger.info(`✅ Created ${records.length} financial records`);
    logger.info('\n📊 Seed Summary:');
    logger.info(`   Users: ${users.length}`);
    logger.info(`   Records: ${records.length} (${income.length} income / ${expense.length} expense)`);
    logger.info(`   Total Income:   ₹${totalIncome.toFixed(2)}`);
    logger.info(`   Total Expense:  ₹${totalExpense.toFixed(2)}`);
    logger.info(`   Net Balance:    ₹${(totalIncome - totalExpense).toFixed(2)}`);
    logger.info('\n🔐 Login Credentials (all use same password):');
    logger.info(`   Admin:   ${env.admin.email ?? 'admin@finance.dev'}`);
    logger.info(`   Analyst: analyst@finance.dev`);
    logger.info(`   Viewer:  viewer@finance.dev`);
    logger.info(`   Password: ${password}`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

const force = process.argv.includes('--force');
seedDatabase(force);
