export type RecordType = 'INCOME' | 'EXPENSE';

export interface FinancialRecord {
  _id: string;
  title: string;
  amount: number;
  type: RecordType;
  category: string;
  date: string;
  notes?: string;
  attachmentUrl?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface RecordFilters {
  search?: string;
  type?: RecordType | 'ALL';
  category?: string[];
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RecordListResponse {
  message: string;
  data: FinancialRecord[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RecordResponse {
  message: string;
  data: FinancialRecord;
}
