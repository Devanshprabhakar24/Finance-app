import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-slate-600 dark:text-slate-400 font-mono">+91</span>
          </div>
          <input
            ref={ref}
            type="tel"
            placeholder="1234567890"
            className={cn(
              'input-field pl-14',
              error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
