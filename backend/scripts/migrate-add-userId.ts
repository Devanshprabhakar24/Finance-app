/**
 * Migration Script: Add userId field to existing records
 * 
 * This script populates the userId field for all existing records
 * by copying the createdBy field value to userId
 */

import mongoose from 'mongoose';
import { FinancialRecord } from '../src/modules/records/record.model';
import { User } from '../src/modules/users/user.model';
import { logger } from '../src/utils/logger';
import { config } from '../src/config/env';

async function migrateRecords() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri);
    logger.info('✅ Connected to database');

    // Step 1: Migrate user roles from VIEWER to USER
    const viewerUsers = await User.find({ role: 'VIEWER' });
    if (viewerUsers.length > 0) {
      logger.info(`Found ${viewerUsers.length} users with VIEWER role, migrating to USER...`);
      await User.updateMany(
        { role: 'VIEWER' },
        { $set: { role: 'USER' } }
      );
      logger.info('✅ User roles migrated successfully');
    } else {
      logger.info('No VIEWER users found to migrate');
    }

    // Step 2: Find all records that don't have userId set
    const recordsWithoutUserId = await FinancialRecord.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    logger.info(`Found ${recordsWithoutUserId.length} records without userId`);

    if (recordsWithoutUserId.length === 0) {
      logger.info('✅ No records to migrate. All records already have userId field.');
      await mongoose.connection.close();
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    // Step 3: Update each record
    for (const record of recordsWithoutUserId) {
      try {
        // Set userId to createdBy (the user who created it owns it)
        if (!record.createdBy) {
          logger.warn(`⚠️  Record ${record._id} has no createdBy field, skipping...`);
          errorCount++;
          continue;
        }

        await FinancialRecord.updateOne(
          { _id: record._id },
          { $set: { userId: record.createdBy } }
        );
        
        successCount++;
        
        if (successCount % 100 === 0) {
          logger.info(`Migrated ${successCount} records...`);
        }
      } catch (error) {
        logger.error(`Failed to migrate record ${record._id}:`, error);
        errorCount++;
      }
    }

    logger.info('');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('Migration completed!');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`✅ Successfully migrated: ${successCount} records`);
    if (errorCount > 0) {
      logger.warn(`⚠️  Failed to migrate: ${errorCount} records`);
    }
    logger.info('');
    logger.info('🔄 Please restart your backend server for changes to take effect');
    logger.info('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateRecords();
