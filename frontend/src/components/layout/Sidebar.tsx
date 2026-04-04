import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Users,
  UserCircle,
  LogOut,
  ChevronLeft,
  Shield,
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { can } = usePermission();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', permission: 'view:dashboard' },
    { path: '/dashboard/records', icon: Receipt, label: 'Transactions', permission: 'view:records' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Insights', permission: 'view:analytics' },
    { path: '/dashboard/users', icon: Users, label: 'Team', permission: 'view:users' },
    { path: '/dashboard/profile', icon: UserCircle, label: 'Account', permission: 'view:profile' },
  ];

  const visibleItems = navItems.filter((item) => can(item.permission));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 z-40',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                Zorvyn
              </h1>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className={cn('w-5 h-5 text-slate-400 transition-transform', sidebarCollapsed && 'rotate-180')} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {!sidebarCollapsed && user && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors w-full"
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
