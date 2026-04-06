"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a secure 6-digit OTP
 * @returns 6-digit OTP string
 */
const generateOtp = () => {
    return crypto_1.default.randomInt(100000, 999999).toString();
};
exports.generateOtp = generateOtp;
