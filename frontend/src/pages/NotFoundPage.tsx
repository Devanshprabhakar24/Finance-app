import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">404</h1>
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-4">
          Page Not Found
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
