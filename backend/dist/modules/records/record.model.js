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
  notes: string;
  attachmentUrl: string;
  attachmentPublicId: string;
  createdBy: mongoose.Types.ObjectId;
  /** Tracks which admin last modified this record for audit purposes */
  lastModifiedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const financialRecordSchema = new Schema(
  {
    title: {
      type,
      required, 'Title is required'],
      trim,
      minlength,
      maxlength,
    },
    amount: {
      type,
      required, 'Amount is required'],
      min, 'Amount must be greater than 0'],
    },
    type: {
      type,
      enum),
      required, 'Type is required'],
    },
    category: {
      type,
      required, 'Category is required'],
      trim,
      minlength,
      maxlength,
    },
    date: {
      type,
      required, 'Date is required'],
    },
    notes: {
      type,
      maxlength,
      trim,
    },
    attachmentUrl: {
      type,
    },
    attachmentPublicId: {
      type,
    },
    createdBy: {
      type,
      ref,
      required,
      index,
    },
    lastModifiedBy: {
      type,
      ref,
    },
    isDeleted: {
      type,
      default,
      index,
    },
    deletedAt: {
      type,
    },
  },
  {
    timestamps,
  }
);

// Compound indexes for performance
financialRecordSchema.index({ isDeleted, date);
financialRecordSchema.index({ isDeleted, type, category);
financialRecordSchema.index({ isDeleted, type, category, date); // For dashboard aggregations
financialRecordSchema.index({ createdBy, isDeleted);
financialRecordSchema.index({ type, date);

// Production optimization indexes (Section 1.1)
// Covers getRecentRecords, filter isDeleted
financialRecordSchema.index({ isDeleted, date, createdAt);

// Full-text search on title + category + notes
financialRecordSchema.index(
  { title, notes, category,
  { weights: { title, category, notes, name: 'record_text_search' }
);

const FinancialRecord = mongoose.model(
  'FinancialRecord',
  financialRecordSchema
);
