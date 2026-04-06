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
exports.User = exports.UserStatus = exports.UserRole = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["ANALYST"] = "ANALYST";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        unique: true,
        trim: true,
        index: true,
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
    },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.VIEWER,
    },
    status: {
        type: String,
        enum: Object.values(UserStatus),
        default: UserStatus.ACTIVE,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    profileImage: {
        type: String,
    },
    profileImagePublicId: {
        type: String,
    },
    lastLogin: {
        type: Date,
    },
    refreshToken: {
        type: String,
        select: false, // Never returned in queries unless explicitly requested
    },
}, {
    timestamps: true,
});
// Indexes for performance
userSchema.index({ email: 1, phone: 1 });
userSchema.index({ status: 1, role: 1 });
// Production optimization indexes (Section 1.1)
// Covers getAllUsers: search by name/email + role + status filter
userSchema.index({ name: 1, email: 1, role: 1, status: 1 });
// Covers authenticate middleware: findById + status check
userSchema.index({ _id: 1, status: 1 });
// Ensure passwordHash is never returned in JSON
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
    },
});
exports.User = mongoose_1.default.model('User', userSchema);
