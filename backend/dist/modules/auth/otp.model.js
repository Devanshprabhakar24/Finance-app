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
exports.Otp = exports.OtpPurpose = exports.OtpType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var OtpType;
(function (OtpType) {
    OtpType["EMAIL"] = "EMAIL";
    OtpType["SMS"] = "SMS";
})(OtpType || (exports.OtpType = OtpType = {}));
var OtpPurpose;
(function (OtpPurpose) {
    OtpPurpose["REGISTER"] = "REGISTER";
    OtpPurpose["LOGIN"] = "LOGIN";
    OtpPurpose["RESET"] = "RESET";
    OtpPurpose["CHANGE_PASSWORD"] = "CHANGE_PASSWORD";
})(OtpPurpose || (exports.OtpPurpose = OtpPurpose = {}));
const otpSchema = new mongoose_1.Schema({
    identifier: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(OtpType),
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    purpose: {
        type: String,
        enum: Object.values(OtpPurpose),
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    lockedUntil: {
        type: Date,
        required: false,
    },
}, {
    timestamps: true,
});
// TTL index - MongoDB will automatically delete expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for efficient queries
otpSchema.index({ identifier: 1, purpose: 1, isUsed: 1 });
// Production optimization index (Section 1.1)
// Covers verifyOtp query: identifier + purpose + isUsed + sort by createdAt
otpSchema.index({ identifier: 1, purpose: 1, isUsed: 1, createdAt: -1 });
exports.Otp = mongoose_1.default.model('Otp', otpSchema);
