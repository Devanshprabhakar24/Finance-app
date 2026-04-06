import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { FinancialRecord } from '../modules/records/record.model';
import { User, UserRole } from '../modules/users/user.model';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/migrate/add-userId
 * Admin-only endpoint to run the userId migration
 * This allows running the migration via API call in production
 */
router.post(
  '/add-userId',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info(`Migration started by admin: ${req.user?.email}`);

    try {
      // Step 1: Migrate user roles from VIEWER to USER
      const viewerUsers = await User.find({ role: 'VIEWER' });
      let userRolesMigrated = 0;
      
      if (viewerUsers.length > 0) {
        await User.updateMany(
          { role: 'VIEWER' },
          { $set: { role: UserRole.USER } }
        );
        userRolesMigrated = viewerUsers.length;
        logger.info(`Migrated ${userRolesMigrated} VIEWER users to USER role`);
      }

      // Step 2: Find records without userId
      const recordsWithoutUserId = await FinancialRecord.find({
        $or: [
          { userId: { $exists: false } },
          { userId: null }
        ]
      });

      logger.info(`Found ${recordsWithoutUserId.length} records without userId`);

      if (recordsWithoutUserId.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Migration completed - no records needed migration',
          data: {
            recordsMigrated: 0,
            userRolesMigrated,
            alreadyMigrated: true
          }
        });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Step 3: Update each record
      for (const record of recordsWithoutUserId) {
        try {
          if (!record.createdBy) {
            const error = `Record ${record._id} has no createdBy field`;
            logger.warn(error);
            errors.push(error);
            errorCount++;
            continue;
          }

          await FinancialRecord.updateOne(
            { _id: record._id },
            { $set: { userId: record.createdBy } }
          );
          
          successCount++;
        } catch (error) {
          const errorMsg = `Failed to migrate record ${record._id}: ${error}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
          errorCount++;
        }
      }

      logger.info(`Migration completed: ${successCount} success, ${errorCount} errors`);

      return res.status(200).json({
        success: true,
        message: 'Migration completed successfully',
        data: {
          recordsMigrated: successCount,
          recordsFailed: errorCount,
          userRolesMigrated,
          errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Return first 10 errors
        }
      });

    } catch (error) {
      logger.error('Migration failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * GET /api/migrate/status
 * Check migration status - how many records need migration
 */
router.get(
  '/status',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const recordsWithoutUserId = await FinancialRecord.countDocuments({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    const totalRecords = await FinancialRecord.countDocuments({ isDeleted: false });
    const viewerUsers = await User.countDocuments({ role: 'VIEWER' });

    return res.status(200).json({
      success: true,
      message: 'Migration status retrieved',
      data: {
        totalRecords,
        recordsNeedingMigration: recordsWithoutUserId,
        recordsAlreadyMigrated: totalRecords - recordsWithoutUserId,
        migrationNeeded: recordsWithoutUserId > 0 || viewerUsers > 0,
        viewerUsersNeedingMigration: viewerUsers
      }
    });
  })
);

export default router;
