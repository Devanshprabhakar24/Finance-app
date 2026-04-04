import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * UI Store
 * Manages UI state like theme, sidebar, modals
 */

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Theme (always dark)
  theme: 'dark';
  
  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Modals
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme state (always dark)
      theme: 'dark',

      // Sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Mobile menu state
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      // Modal state
      activeModal: null,
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: STORAGE_KEYS.THEME,
      partialPersist: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

/**
 * Apply dark theme to document
 */
function applyTheme() {
  const root = window.document.documentElement;
  root.classList.remove('light');
  root.classList.add('dark');
}

/**
 * Initialize theme on app load (always dark)
 */
export function initializeTheme() {
  applyTheme();
}

/**
 * Selectors
 */
export const selectTheme = (state: UIState) => state.theme;
export const selectSidebarCollapsed = (state: UIState) => state.sidebarCollapsed;
export const selectMobileMenuOpen = (state: UIState) => state.mobileMenuOpen;
export const selectActiveModal = (state: UIState) => state.activeModal;
