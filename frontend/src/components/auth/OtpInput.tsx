import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { cn } from '@/utils/cn';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({ length = 6, value, onChange, error, disabled }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  const focusInput = (index: number) => {
    const input = inputRefs.current[index];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) return;

    const newDigits = [...digits];
    newDigits[index] = newValue;
    const newOtp = newDigits.join('');
    
    onChange(newOtp);

    // Auto-advance to next input
    if (newValue && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current is empty, go back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        focusInput(index - 1);
      } else {
        // Clear current
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Only allow digits
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (digits) {
      onChange(digits);
      // Focus last filled input
      const lastIndex = Math.min(digits.length - 1, length - 1);
      setTimeout(() => focusInput(lastIndex), 0);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-mono rounded-lg border-2 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500 animate-shake'
              : 'border-slate-300 dark:border-slate-600 focus:border-primary-500 focus:ring-primary-500',
            digit && !error && 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
            disabled && 'opacity-50 cursor-not-allowed',
            'dark:bg-slate-800 dark:text-slate-100'
          )}
        />
      ))}
    </div>
  );
}
