import apiClient from './axios';
import type { RecordFilters, RecordListResponse, RecordResponse, FinancialRecord } from '@/types/record.types';

/**
 * Financial Records API calls
 */

export interface CreateRecordPayload {
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  notes?: string;
  attachmentUrl?: string;
  userId?: string; // Admin can specify which user the record belongs to
}

export type UpdateRecordPayload = Partial<CreateRecordPayload>;

/**
 * Get paginated list of records with filters
 * Admin/Analyst can pass userId query param to filter by user
 */
export async function getRecords(filters?: RecordFilters & { userId?: string }): Promise<RecordListResponse> {
  const response = await apiClient.get<RecordListResponse>('/records', {
    params: filters,
  });
  return response.data;
}

/**
 * Create new record
 * Admin can include userId in payload to create for any user
 */
export async function createRecord(data: CreateRecordPayload): Promise<RecordResponse> {
  const response = await apiClient.post<RecordResponse>('/records', data);
  return response.data;
}

/**
 * Update existing record
 */
export async function updateRecord(
  id: string,
  data: UpdateRecordPayload
): Promise<RecordResponse> {
  const response = await apiClient.patch<RecordResponse>(`/records/${id}`, data);
  return response.data;
}

/**
 * Delete record (soft delete)
 */
export async function deleteRecord(id: string): Promise<void> {
  await apiClient.delete(`/records/${id}`);
}
