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
}

export type UpdateRecordPayload = Partial<CreateRecordPayload>;

/**
 * Get paginated list of records with filters
 */
export async function getRecords(filters?: RecordFilters): Promise<RecordListResponse> {
  const response = await apiClient.get<RecordListResponse>('/records', {
    params: filters,
  });
  return response.data;
}

/**
 * Create new record
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
