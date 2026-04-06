import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { getRecords, createRecord, updateRecord, deleteRecord } from '@/api/records.api';
import { queryKeys } from '@/api/queryClient';
import { useAuthStore } from '@/store/auth.store';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  X,
  Upload,
  Paperclip,
  ExternalLink,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/utils/format';
import type { CreateRecordPayload } from '@/api/records.api';

import apiClient from '@/api/axios';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface FinancialRecord {
  _id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentPublicId?: string;
  createdBy?: {
    name: string;
  };
}

export default function RecordsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  // State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Modal refs for keyboard trap
  const createModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  // Reset page when filters change
  useEffect(() => { 
    setPage(1); 
  }, [debouncedSearch, typeFilter, categoryFilter, fromDate, toDate]);

  // Keyboard trap for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateModal) {
          setShowCreateModal(false);
          resetForm();
        } else if (showEditModal) {
          setShowEditModal(false);
          setSelectedRecord(null);
          resetForm();
        } else if (showDeleteModal) {
          setShowDeleteModal(false);
          setSelectedRecord(null);
        }
      }

      if (e.key === 'Tab') {
        const activeModal = showCreateModal ? createModalRef.current : 
                           showEditModal ? editModalRef.current : 
                           showDeleteModal ? deleteModalRef.current : null;

        if (activeModal) {
          const focusableElements = activeModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      }
    };

    if (showCreateModal || showEditModal || showDeleteModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showCreateModal, showEditModal, showDeleteModal]);

  // Focus management for modals
  useEffect(() => {
    if (showCreateModal && createModalRef.current) {
      const firstInput = createModalRef.current.querySelector('input, select, textarea') as HTMLElement;
      firstInput?.focus();
    }
  }, [showCreateModal]);

  useEffect(() => {
    if (showEditModal && editModalRef.current) {
      const firstInput = editModalRef.current.querySelector('input, select, textarea') as HTMLElement;
      firstInput?.focus();
    }
  }, [showEditModal]);

  useEffect(() => {
    if (showDeleteModal && deleteModalRef.current) {
      const cancelButton = deleteModalRef.current.querySelector('button') as HTMLElement;
      cancelButton?.focus();
    }
  }, [showDeleteModal]);

  // Form state
  const [formData, setFormData] = useState<CreateRecordPayload>({
    title: '',
    amount: 0,
    type: 'EXPENSE',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Fetch records with search and date range
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.records.list({ 
      type: typeFilter || undefined, 
      category: categoryFilter || undefined, 
      search: debouncedSearch || undefined, 
      fromDate, 
      toDate, 
      page, 
      limit: 10 
    }),
    queryFn: () => getRecords({
      type: typeFilter || undefined,
      category: categoryFilter || undefined,
      search: debouncedSearch || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      limit: 10,
    }),
    staleTime: 30 * 1000, // 30 seconds - shorter for records to show updates quickly
    refetchOnWindowFocus: true, // Enable refetch on focus for records
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createRecord,
    onSuccess: () => {
      // Invalidate all records queries
      queryClient.invalidateQueries({ queryKey: queryKeys.records.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      
      // Force refetch the current query
      queryClient.refetchQueries({ 
        queryKey: queryKeys.records.list({ 
          type: typeFilter || undefined, 
          category: categoryFilter || undefined, 
          search: debouncedSearch || undefined, 
          fromDate, 
          toDate, 
          page, 
          limit: 10 
        })
      });
      
      toast.success('Record created successfully');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to create record');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRecordPayload> }) =>
      updateRecord(id, data),
    onSuccess: () => {
      // Invalidate all records queries
      queryClient.invalidateQueries({ queryKey: queryKeys.records.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      
      // Force refetch the current query
      queryClient.refetchQueries({ 
        queryKey: queryKeys.records.list({ 
          type: typeFilter || undefined, 
          category: categoryFilter || undefined, 
          search: debouncedSearch || undefined, 
          fromDate, 
          toDate, 
          page, 
          limit: 10 
        })
      });
      
      toast.success('Record updated successfully');
      setShowEditModal(false);
      setSelectedRecord(null);
      resetForm();
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to update record');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      // Invalidate all records queries
      queryClient.invalidateQueries({ queryKey: queryKeys.records.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      
      // Force refetch the current query
      queryClient.refetchQueries({ 
        queryKey: queryKeys.records.list({ 
          type: typeFilter || undefined, 
          category: categoryFilter || undefined, 
          search: debouncedSearch || undefined, 
          fromDate, 
          toDate, 
          page, 
          limit: 10 
        })
      });
      
      toast.success('Record deleted successfully');
      setShowDeleteModal(false);
      setSelectedRecord(null);
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      amount: 0,
      type: 'EXPENSE',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.amount || !formData.category) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Fix: Validate amount is positive
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }
    
    // Ensure date is in proper format
    const recordData = {
      ...formData,
      date: formData.date // Keep as YYYY-MM-DD format, backend will handle conversion
    };
    
    createMutation.mutate(recordData);
  };

  const handleEdit = (record: FinancialRecord) => {
    setSelectedRecord(record);
    setFormData({
      title: record.title,
      amount: record.amount,
      type: record.type,
      category: record.category,
      date: new Date(record.date).toISOString().split('T')[0],
      notes: record.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!selectedRecord) return;
    
    // Fix: Validate amount is positive
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }
    
    // Ensure date is in proper format
    const recordData = {
      ...formData,
      date: formData.date // Keep as YYYY-MM-DD format, backend will handle conversion
    };
    
    updateMutation.mutate({ id: selectedRecord._id, data: recordData });
  };

  const handleDelete = (record: FinancialRecord) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedRecord) return;
    deleteMutation.mutate(selectedRecord._id);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRecord) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, and PDF files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingAttachment(true);

    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const response = await apiClient.post(
        `/records/${selectedRecord._id}/attachment`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      // Update the selected record with the new attachment URL
      setSelectedRecord({
        ...selectedRecord,
        attachmentUrl: response.data.data.attachmentUrl,
        attachmentPublicId: response.data.data.attachmentPublicId,
      });

      queryClient.invalidateQueries({ queryKey: ['records'] });
      toast.success('Attachment uploaded successfully');
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error(error.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const records = data?.data || [];
  const pagination = data?.meta;

  const categories = {
    INCOME: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'],
    EXPENSE: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Insurance', 'Rent', 'Other Expense'],
  };

  return (
    <div>
      <PageHeader
        title="Financial Records"
        subtitle="Manage your income and expenses"
        action={
          <div className="flex gap-2">
            {/* Manual refresh button */}
            <button
              type="button"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: queryKeys.records.all });
                queryClient.refetchQueries({ 
                  queryKey: queryKeys.records.list({ 
                    type: typeFilter || undefined, 
                    category: categoryFilter || undefined, 
                    search: debouncedSearch || undefined, 
                    fromDate, 
                    toDate, 
                    page, 
                    limit: 10 
                  })
                });
              }}
              className="btn-secondary flex items-center gap-2"
              title="Refresh records"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="mt-6 card">
        <div className="flex flex-col gap-4">
          {/* Search and Type/Category Row */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search records..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            <div className="w-full md:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field"
              >
                <option value="">All Categories</option>
                {[...categories.INCOME, ...categories.EXPENSE].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="input-field"
                max={toDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="input-field"
                min={fromDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {(fromDate || toDate) && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setPage(1);
                  }}
                  className="btn-secondary whitespace-nowrap"
                >
                  Clear Dates
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="mt-6 card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              {debouncedSearch 
                ? `No results found for "${debouncedSearch}"`
                : isAdmin 
                  ? 'No records yet. Click "Add Record" to create your first transaction.' 
                  : 'No records found.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {records.map((record: FinancialRecord) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      record.type === 'INCOME'
                        ? 'bg-success-100 dark:bg-success-900/30'
                        : 'bg-danger-100 dark:bg-danger-900/30'
                    }`}>
                      {record.type === 'INCOME' ? (
                        <TrendingUp className="w-5 h-5 text-success-600 dark:text-success-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {record.title}
                        {record.attachmentUrl && (
                          <a
                            href={record.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            title="View attachment"
                          >
                            <Paperclip className="w-4 h-4" />
                          </a>
                        )}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {record.category} • {formatDate(record.date)}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{record.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        record.type === 'INCOME'
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-danger-600 dark:text-danger-400'
                      }`}>
                        {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        by {record.createdBy?.name || 'Unknown'}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(record)}
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(record)}
                          className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.totalCount)} of {pagination.totalCount} records
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={createModalRef} className="card max-w-lg w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
            <div className="flex items-center justify-between mb-6">
              <h3 id="create-modal-title" className="text-xl font-semibold">Create Record</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category: '' })}
                  className="input-field"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Monthly Salary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount *</label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {categories[formData.type].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Optional notes..."
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={editModalRef} className="card max-w-lg w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
            <div className="flex items-center justify-between mb-6">
              <h3 id="edit-modal-title" className="text-xl font-semibold">Edit Record</h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRecord(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category: '' })}
                  className="input-field"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount *</label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {categories[formData.type].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Attachment Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Attachment</label>
                
                {/* Current Attachment Display */}
                {selectedRecord.attachmentUrl && (
                  <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Current attachment
                      </span>
                    </div>
                    <a
                      href={selectedRecord.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Upload New Attachment */}
                <div className="relative">
                  <input
                    id="attachment-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={handleAttachmentUpload}
                    disabled={uploadingAttachment}
                    className="hidden"
                  />
                  <label
                    htmlFor="attachment-upload"
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      uploadingAttachment
                        ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 cursor-not-allowed'
                        : 'border-slate-300 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                    }`}
                  >
                    {uploadingAttachment ? (
                      <>
                        <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedRecord.attachmentUrl ? 'Replace attachment' : 'Upload attachment'}
                        </span>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supported: JPEG, PNG, WebP, PDF (max 5MB)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRecord(null);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={deleteModalRef} className="card max-w-md w-full" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <h3 id="delete-modal-title" className="text-xl font-semibold text-danger-600 mb-4">Delete Record</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
              <p className="font-semibold">{selectedRecord.title}</p>
              <p className="text-sm text-slate-500">
                {formatCurrency(selectedRecord.amount)} • {selectedRecord.category}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRecord(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
