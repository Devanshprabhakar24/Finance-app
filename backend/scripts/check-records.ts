import mongoose from 'mongoose';
import { FinancialRecord } from '../src/modules/records/record.model';
import { User } from '../src/modules/users/user.model';
import { logger } from '../src/utils/logger';
import { env } from '../src/config/env';

async function checkRecords() {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info('✅ Connected to database');

    // Check total records
    const totalRecords = await FinancialRecord.countDocuments();
    logger.info(`Total records in database: ${totalRecords}`);

    // Check records with userId
    const recordsWithUserId = await FinancialRecord.countDocuments({ userId: { $exists: true, $ne: null } });
    logger.info(`Records with userId: ${recordsWithUserId}`);

    // Check records without userId
    const recordsWithoutUserId = await FinancialRecord.countDocuments({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });
    logger.info(`Records without userId: ${recordsWithoutUserId}`);

    // Check users
    const totalUsers = await User.countDocuments();
    logger.info(`Total users in database: ${totalUsers}`);

    // Show sample records
    const sampleRecords = await FinancialRecord.find().limit(3).lean();
    logger.info('Sample records:');
    sampleRecords.forEach((record: any) => {
      logger.info(`  - ${record.title}: userId=${record.userId}, createdBy=${record.createdBy}`);
    });

    // Show users
    const users = await User.find().select('_id name email role').lean();
    logger.info('Users in database:');
    users.forEach((user: any) => {
      logger.info(`  - ${user.name} (${user.email}): _id=${user._id}, role=${user.role}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Check failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkRecords();
