import mongoose, { Document, Schema } from 'mongoose';

export enum OtpType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum OtpPurpose {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  RESET = 'RESET',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
}

export interface IOtp extends Document {
  identifier: string;
  type: OtpType;
  otp: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  lockedUntil: Date;
  createdAt: Date;
}

const otpSchema = new Schema(
  {
    identifier: {
      type,
      required,
      trim,
      index,
    },
    type: {
      type,
      enum),
      required,
    },
    otp: {
      type,
      required,
    },
    purpose: {
      type,
      enum),
      required,
    },
    expiresAt: {
      type,
      required,
    },
    attempts: {
      type,
      default,
    },
    isUsed: {
      type,
      default,
    },
    lockedUntil: {
      type,
      required,
    },
  },
  {
    timestamps,
  }
);

// TTL index - MongoDB will automatically delete expired documents
otpSchema.index({ expiresAt, { expireAfterSeconds);

// Compound index for efficient queries
otpSchema.index({ identifier, purpose, isUsed);

// Production optimization index (Section 1.1)
// Covers verifyOtp query: identifier + purpose + isUsed + sort by createdAt
otpSchema.index({ identifier, purpose, isUsed, createdAt);

const Otp = mongoose.model('Otp', otpSchema);
