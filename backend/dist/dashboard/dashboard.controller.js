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
exports.getTopCategories = exports.getRecent = exports.getTrends = exports.getByCategory = exports.getSummary = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const dashboardService = __importStar(require("./dashboard.service"));
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Parse an optional ISO date string from a query param.
 * Returns undefined (not null) so callers can use ?? cleanly.
 */
const parseDate = (val, paramName) => {
    if (!val)
        return undefined;
    const d = new Date(val);
    if (isNaN(d.getTime())) {
        throw new errorHandler_1.ValidationError(`Invalid date for parameter '${paramName}'`);
    }
    return d;
};
/**
 * GET /api/dashboard/summary
 * Optional query: ?from=ISO&to=ISO
 */
exports.getSummary = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const from = parseDate(req.query.from, 'from');
    const to = parseDate(req.query.to, 'to');
    if (from && to && from > to) {
        throw new errorHandler_1.ValidationError("'from' date must be before or equal to 'to' date");
    }
    const summary = await dashboardService.getDashboardSummary(from || to ? { from, to } : undefined);
    (0, response_1.sendSuccess)(res, 'Dashboard summary retrieved successfully', summary);
});
/**
 * GET /api/dashboard/by-category
 * Optional query: ?from=ISO&to=ISO
 */
exports.getByCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const from = parseDate(req.query.from, 'from');
    const to = parseDate(req.query.to, 'to');
    const categoryData = await dashboardService.getRecordsByCategory(from || to ? { from, to } : undefined);
    (0, response_1.sendSuccess)(res, 'Category breakdown retrieved successfully', categoryData);
});
/**
 * GET /api/dashboard/trends
 * Optional query: ?year=2024
 */
exports.getTrends = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const trends = await dashboardService.getMonthlyTrends(year);
    (0, response_1.sendSuccess)(res, 'Monthly trends retrieved successfully', trends);
});
/**
 * GET /api/dashboard/recent
 * Optional query: ?limit=10 (max 20)
 */
exports.getRecent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const records = await dashboardService.getRecentRecords(limit);
    (0, response_1.sendSuccess)(res, 'Recent records retrieved successfully', records);
});
/**
 * GET /api/dashboard/top-categories
 * Optional query: ?from=ISO&to=ISO
 */
exports.getTopCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const from = parseDate(req.query.from, 'from');
    const to = parseDate(req.query.to, 'to');
    const topCategories = await dashboardService.getTopExpenseCategories(from || to ? { from, to } : undefined);
    (0, response_1.sendSuccess)(res, 'Top expense categories retrieved successfully', topCategories);
});
