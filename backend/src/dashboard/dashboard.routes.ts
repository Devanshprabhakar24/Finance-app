import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { UserRole } from '../modules/users/user.model';
import { cacheControl } from '../middleware/cacheControl';

const router = Router();

router.use(authenticate);

// ── All authenticated users including VIEWER ────────────────────────────────
// Section 2.1: Cache control for dashboard endpoints
// Summary: cache 2 min browser, 5 min CDN
router.get('/summary', cacheControl(120, 300), dashboardController.getSummary);
// Recent records: short cache since records change frequently
router.get('/recent', cacheControl(30, 60), dashboardController.getRecent);

// ── ANALYST and ADMIN only ──────────────────────────────────────────────────
// Categories: 5 min cache
router.get(
  '/by-category',
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  cacheControl(300, 600),
  dashboardController.getByCategory
);
// Trends: cache 10 min (changes once per month at most)
router.get(
  '/trends',
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  cacheControl(600, 1800),
  dashboardController.getTrends
);
// Top categories: 5 min cache
router.get(
  '/top-categories',
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  cacheControl(300, 600),
  dashboardController.getTopCategories
);

export default router;
