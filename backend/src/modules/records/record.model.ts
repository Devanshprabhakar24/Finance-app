import mongoose, { Document, Schema } from 'mongoose';

export enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface IFinancialRecord extends Document {
  title: string;
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  notes?: string;
  attachmentUrl?: string;
  attachmentPublicId?: string;
  createdBy: mongoose.Types.ObjectId;
  /** Tracks which admin last modified this record for audit purposes */
  lastModifiedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const financialRecordSchema = new Schema<IFinancialRecord>(
  {
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
financialRecordSchema.index({ isDeleted: 1, date: -1 });
financialRecordSchema.index({ isDeleted: 1, type: 1, category: 1 });
financialRecordSchema.index({ isDeleted: 1, type: 1, category: 1, date: -1 }); // For dashboard aggregations
financialRecordSchema.index({ createdBy: 1, isDeleted: 1 });
financialRecordSchema.index({ type: 1, date: -1 });

export const FinancialRecord = mongoose.model<IFinancialRecord>(
  'FinancialRecord',
  financialRecordSchema
);
