import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { UserRole } from '../modules/users/user.model';

const router = Router();

router.use(authenticate);

// ── All authenticated users including VIEWER ────────────────────────────────
// Summary supports optional ?from=ISO&to=ISO date range filter
router.get('/summary', dashboardController.getSummary);
router.get('/recent', dashboardController.getRecent);

// ── ANALYST and ADMIN only ──────────────────────────────────────────────────
router.get(
  '/by-category',
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  dashboardController.getByCategory
);
router.get(
  '/trends',
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  dashboardController.getTrends
);
router.get(
  '/top-categories',
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  dashboardController.getTopCategories
);

export default router;
