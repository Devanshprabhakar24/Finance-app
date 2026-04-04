import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <ShieldAlert className="w-24 h-24 text-danger-600 dark:text-danger-400 mx-auto" />
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-6">
          Access Denied
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8">
          You don't have permission to access this page.
        </p>
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
