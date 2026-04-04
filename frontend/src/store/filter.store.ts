import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS, PAGINATION } from '@/utils/constants';
import { RecordFilters } from '@/types/record.types';

/**
 * Filter Store
 * Persists user filter preferences across sessions
 */

interface FilterState {
  // Record filters
  recordFilters: RecordFilters;
  setRecordFilters: (filters: Partial<RecordFilters>) => void;
  resetRecordFilters: () => void;

  // User filters (admin)
  userFilters: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  };
  setUserFilters: (filters: Partial<FilterState['userFilters']>) => void;
  resetUserFilters: () => void;

  // Dashboard filters
  dashboardYear: number;
  setDashboardYear: (year: number) => void;
}

const defaultRecordFilters: RecordFilters = {
  search: '',
  type: 'ALL',
  category: [],
  fromDate: undefined,
  toDate: undefined,
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sortBy: 'date',
  sortOrder: 'desc',
};

const defaultUserFilters = {
  search: '',
  role: undefined,
  status: undefined,
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      // Record filters
      recordFilters: defaultRecordFilters,
      setRecordFilters: (filters) =>
        set((state) => ({
          recordFilters: { ...state.recordFilters, ...filters },
        })),
      resetRecordFilters: () =>
        set({
          recordFilters: defaultRecordFilters,
        }),

      // User filters
      userFilters: defaultUserFilters,
      setUserFilters: (filters) =>
        set((state) => ({
          userFilters: { ...state.userFilters, ...filters },
        })),
      resetUserFilters: () =>
        set({
          userFilters: defaultUserFilters,
        }),

      // Dashboard filters
      dashboardYear: new Date().getFullYear(),
      setDashboardYear: (year) => set({ dashboardYear: year }),
    }),
    {
      name: STORAGE_KEYS.FILTER_PREFERENCES,
    }
  )
);

/**
 * Selectors
 */
export const selectRecordFilters = (state: FilterState) => state.recordFilters;
export const selectUserFilters = (state: FilterState) => state.userFilters;
export const selectDashboardYear = (state: FilterState) => state.dashboardYear;

/**
 * Helper to check if any record filters are active
 */
export function hasActiveRecordFilters(filters: RecordFilters): boolean {
  return !!(
    filters.search ||
    (filters.type && filters.type !== 'ALL') ||
    (filters.category && filters.category.length > 0) ||
    filters.fromDate ||
    filters.toDate
  );
}
