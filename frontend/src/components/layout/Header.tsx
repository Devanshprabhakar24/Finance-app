import { useUIStore } from '@/store/ui.store';
import { Menu } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { toggleMobileMenu } = useUIStore();

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        {title && (
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {action}
      </div>
    </header>
  );
}
