"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController = __importStar(require("./dashboard.controller"));
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const cacheControl_1 = require("../middleware/cacheControl");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// All dashboard routes use resolveTargetUser to handle RBAC
// Section 2.1: Cache control for dashboard endpoints
// Summary: cache 2 min browser, 5 min CDN
router.get('/summary', authorize_1.resolveTargetUser, (0, cacheControl_1.cacheControl)(120, 300), dashboardController.getSummary);
// Recent records: short cache since records change frequently
router.get('/recent', authorize_1.resolveTargetUser, (0, cacheControl_1.cacheControl)(30, 60), dashboardController.getRecent);
// Categories: 5 min cache
router.get('/by-category', authorize_1.resolveTargetUser, (0, cacheControl_1.cacheControl)(300, 600), dashboardController.getByCategory);
// Trends: cache 10 min (changes once per month at most)
router.get('/trends', authorize_1.resolveTargetUser, (0, cacheControl_1.cacheControl)(600, 1800), dashboardController.getTrends);
// Top categories: 5 min cache
router.get('/top-categories', authorize_1.resolveTargetUser, (0, cacheControl_1.cacheControl)(300, 600), dashboardController.getTopCategories);
exports.default = router;
