import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/utils/cn';

export function AppLayout() {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0F1E] via-slate-900 to-[#0A0F1E]">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse" />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse delay-1000" />
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300 relative z-10',
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-20'
        )}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
