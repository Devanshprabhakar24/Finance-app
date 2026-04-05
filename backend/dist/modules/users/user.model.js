import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  profileImage: string;
  profileImagePublicId: string;
  /** Stored refresh token — cleared on logout to prevent token reuse */
  refreshToken: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    name: {
      type,
      required, 'Name is required'],
      trim,
      minlength,
      maxlength,
    },
    email: {
      type,
      required, 'Email is required'],
      unique,
      lowercase,
      trim,
      index,
    },
    phone: {
      type,
      required, 'Phone is required'],
      unique,
      trim,
      index,
    },
    passwordHash: {
      type,
      required, 'Password is required'],
      select,
    },
    role: {
      type,
      enum),
      default,
    },
    status: {
      type,
      enum),
      default,
    },
    isVerified: {
      type,
      default,
    },
    profileImage: {
      type,
    },
    profileImagePublicId: {
      type,
    },
    lastLogin: {
      type,
    },
    refreshToken: {
      type,
      select, // Never returned in queries unless explicitly requested
    },
  },
  {
    timestamps,
  }
);

// Indexes for performance
userSchema.index({ email, phone);
userSchema.index({ status, role);

// Production optimization indexes (Section 1.1)
// Covers getAllUsers: search by name/email + role + status filter
userSchema.index({ name, email, role, status);

// Covers authenticate middleware: findById + status check
userSchema.index({ _id, status);

// Ensure passwordHash is never returned in JSON
userSchema.set('toJSON', {
  transform, ret) => {
    delete ret.passwordHash;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
