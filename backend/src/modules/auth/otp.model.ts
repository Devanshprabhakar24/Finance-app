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
  lockedUntil?: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
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
  },
  {
    timestamps: true,
  }
);

// TTL index - MongoDB will automatically delete expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries
otpSchema.index({ identifier: 1, purpose: 1, isUsed: 1 });

// Production optimization index (Section 1.1)
// Covers verifyOtp query: identifier + purpose + isUsed + sort by createdAt
otpSchema.index({ identifier: 1, purpose: 1, isUsed: 1, createdAt: -1 });

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
