import { Router } from 'express';
import multer from 'multer';
import * as recordController from './record.controller';
import { authenticate } from '../../middleware/authenticate';
import { resolveTargetUser } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
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

// All routes require authentication
router.use(authenticate);

// GET /records - All authenticated users can access (RBAC in service layer)
router.get(
  '/',
  resolveTargetUser,
  validateQuery(recordFilterSchema),
  recordController.getAllRecords
);

// GET /records/:id - All authenticated users (RBAC in service layer)
router.get(
  '/:id',
  recordController.getRecordById
);

// POST /records - Admin and User can create (Analyst forbidden in service)
router.post(
  '/',
  resolveTargetUser,
  validateBody(createRecordSchema),
  recordController.createRecord
);

// PATCH /records/:id - Admin and User can update (Analyst forbidden in service)
router.patch(
  '/:id',
  validateBody(updateRecordSchema),
  recordController.updateRecord
);

// DELETE /records/:id - Admin and User can delete (Analyst forbidden in service)
router.delete('/:id', recordController.deleteRecord);

// POST /records/:id/attachment - Admin and User can upload
router.post(
  '/:id/attachment',
  upload.single('attachment'),
  recordController.uploadAttachment
);

export default router;
