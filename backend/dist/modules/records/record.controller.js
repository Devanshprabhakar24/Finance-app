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
exports.uploadAttachment = exports.deleteRecord = exports.updateRecord = exports.getRecordById = exports.getAllRecords = exports.createRecord = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const recordService = __importStar(require("./record.service"));
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * POST /api/records
 */
exports.createRecord = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const record = await recordService.createRecord(data, req.user._id.toString());
    (0, response_1.sendSuccess)(res, 'Financial record created successfully', record, undefined, 201);
});
/**
 * GET /api/records
 */
exports.getAllRecords = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await recordService.getAllRecords(filters);
    (0, response_1.sendSuccess)(res, 'Financial records retrieved successfully', result.data, result.meta);
});
/**
 * GET /api/records/:id
 */
exports.getRecordById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const record = await recordService.getRecordById(req.params.id);
    (0, response_1.sendSuccess)(res, 'Financial record retrieved successfully', record);
});
/**
 * PATCH /api/records/:id
 */
exports.updateRecord = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const record = await recordService.updateRecord(req.params.id, data, req.user._id.toString());
    (0, response_1.sendSuccess)(res, 'Financial record updated successfully', record);
});
/**
 * DELETE /api/records/:id
 */
exports.deleteRecord = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await recordService.deleteRecord(req.params.id, req.user._id.toString());
    (0, response_1.sendSuccess)(res, 'Financial record deleted successfully');
});
/**
 * POST /api/records/:id/attachment
 */
exports.uploadAttachment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        throw new errorHandler_1.ValidationError('No file uploaded');
    }
    const record = await recordService.uploadAttachment(req.params.id, req.file.buffer);
    (0, response_1.sendSuccess)(res, 'Attachment uploaded successfully', { attachmentUrl: record.attachmentUrl });
});
