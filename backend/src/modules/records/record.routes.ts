import { Router } from 'express';
import multer from 'multer';
import * as recordController from './record.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { UserRole } from '../users/user.model';
import { createRecordSchema, updateRecordSchema, recordFilterSchema } from './record.schema';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'));
    }
  },
});

router.use(authenticate);

// Read — ANALYST and ADMIN
router.get(
  '/',
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  validateQuery(recordFilterSchema),
  recordController.getAllRecords
);

router.get(
  '/:id',
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  recordController.getRecordById
);

// Write — ADMIN only
router.post(
  '/',
  requireRole(UserRole.ADMIN),
  validateBody(createRecordSchema),
  recordController.createRecord
);

router.patch(
  '/:id',
  requireRole(UserRole.ADMIN),
  validateBody(updateRecordSchema),
  recordController.updateRecord
);

router.delete('/:id', requireRole(UserRole.ADMIN), recordController.deleteRecord);

router.post(
  '/:id/attachment',
  requireRole(UserRole.ADMIN),
  upload.single('attachment'),
  recordController.uploadAttachment
);

export default router;
