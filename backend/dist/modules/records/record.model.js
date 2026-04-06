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
exports.FinancialRecord = exports.RecordType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RecordType;
(function (RecordType) {
    RecordType["INCOME"] = "INCOME";
    RecordType["EXPENSE"] = "EXPENSE";
})(RecordType || (exports.RecordType = RecordType = {}));
const financialRecordSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
        type: String,
        enum: Object.values(RecordType),
        required: [true, 'Type is required'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
    },
    notes: {
        type: String,
        maxlength: 500,
        trim: true,
    },
    attachmentUrl: {
        type: String,
    },
    attachmentPublicId: {
        type: String,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'], // 🔒 SECURITY: Now required for data isolation
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    lastModifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    deletedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Compound indexes for performance
financialRecordSchema.index({ userId: 1, isDeleted: 1, date: -1 });
financialRecordSchema.index({ isDeleted: 1, date: -1 });
financialRecordSchema.index({ isDeleted: 1, type: 1, category: 1 });
financialRecordSchema.index({ isDeleted: 1, type: 1, category: 1, date: -1 }); // For dashboard aggregations
financialRecordSchema.index({ createdBy: 1, isDeleted: 1 });
financialRecordSchema.index({ type: 1, date: -1 });
// Production optimization indexes (Section 1.1)
// Covers getRecentRecords: sort by date desc, filter isDeleted
financialRecordSchema.index({ isDeleted: 1, date: -1, createdAt: -1 });
// Full-text search on title + category + notes
financialRecordSchema.index({ title: 'text', notes: 'text', category: 'text' }, { weights: { title: 3, category: 2, notes: 1 }, name: 'record_text_search' });
exports.FinancialRecord = mongoose_1.default.model('FinancialRecord', financialRecordSchema);
