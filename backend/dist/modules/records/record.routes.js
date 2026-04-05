const { Router  } = require('express');
const multer = require('multer');
const recordController = require('./record.controller');
const { authenticate  } = require('../../middleware/authenticate');
const { requireRole  } = require('../../middleware/authorize');
const { validateBody, validateQuery  } = require('../../middleware/validate');
const { UserRole  } = require('../users/user.model');
const { createRecordSchema, updateRecordSchema, recordFilterSchema  } = require('./record.schema');

const router = Router();

const upload = multer({
  storage),
  limits: { fileSize,
  fileFilter, file, cb) => {
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

module.exports = router;
