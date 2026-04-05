const { Router  } = require('express');
const dashboardController = require('./dashboard.controller');
const { authenticate  } = require('../middleware/authenticate');
const { requireRole  } = require('../middleware/authorize');
const { UserRole  } = require('../modules/users/user.model');
const { cacheControl  } = require('../middleware/cacheControl');

const router = Router();

router.use(authenticate);

// ── All authenticated users including VIEWER ────────────────────────────────
// Section 2.1: Cache control for dashboard endpoints
// Summary, 5 min CDN
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
// Trends)
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

module.exports = router;
