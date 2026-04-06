import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { resolveTargetUser } from '../middleware/authorize';
import { cacheControl } from '../middleware/cacheControl';

const router = Router();

router.use(authenticate);

// All dashboard routes use resolveTargetUser to handle RBAC
// Section 2.1: Cache control for dashboard endpoints
// Summary: cache 2 min browser, 5 min CDN
router.get('/summary', resolveTargetUser, cacheControl(120, 300), dashboardController.getSummary);
// Recent records: short cache since records change frequently
router.get('/recent', resolveTargetUser, cacheControl(30, 60), dashboardController.getRecent);
// Categories: 5 min cache
router.get('/by-category', resolveTargetUser, cacheControl(300, 600), dashboardController.getByCategory);
// Trends: cache 10 min (changes once per month at most)
router.get('/trends', resolveTargetUser, cacheControl(600, 1800), dashboardController.getTrends);
// Top categories: 5 min cache
router.get('/top-categories', resolveTargetUser, cacheControl(300, 600), dashboardController.getTopCategories);

export default router;
