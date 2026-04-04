import { checkPasswordStrength } from '@/schemas/auth.schema';
import { cn } from '@/utils/cn';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, label, checks } = checkPasswordStrength(password);

  const strengthColors = {
    0: 'bg-slate-300 dark:bg-slate-600',
    1: 'bg-danger-500',
    2: 'bg-warning-500',
    3: 'bg-warning-400',
    4: 'bg-success-500',
    5: 'bg-success-600',
  };

  const strengthLabels = {
    0: 'text-slate-600 dark:text-slate-400',
    1: 'text-danger-600 dark:text-danger-400',
    2: 'text-warning-600 dark:text-warning-400',
    3: 'text-warning-500 dark:text-warning-300',
    4: 'text-success-600 dark:text-success-400',
    5: 'text-success-700 dark:text-success-300',
  };

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                level <= score ? strengthColors[score] : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
          ))}
        </div>
        <p className={cn('text-xs font-medium', strengthLabels[score])}>
          Password strength: {label}
        </p>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        <Requirement met={checks.length} label="At least 8 characters" />
        <Requirement met={checks.uppercase} label="One uppercase letter" />
        <Requirement met={checks.lowercase} label="One lowercase letter" />
        <Requirement met={checks.number} label="One number" />
        <Requirement met={checks.special} label="One special character" />
      </div>
    </div>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="w-4 h-4 text-success-600 dark:text-success-400" />
      ) : (
        <X className="w-4 h-4 text-slate-400 dark:text-slate-600" />
      )}
      <span className={cn(met ? 'text-success-700 dark:text-success-300' : 'text-slate-600 dark:text-slate-400')}>
        {label}
      </span>
    </div>
  );
}
