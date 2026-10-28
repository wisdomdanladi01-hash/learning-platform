import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className = '', children, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="block mb-1.5 text-sm font-semibold text-ink-800">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={[
            'w-full h-11 pl-3.5 pr-10 rounded-xl border bg-white text-ink-900 appearance-none',
            'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 focus:outline-none',
            error ? 'border-red-400' : 'border-ink-200',
            'disabled:bg-ink-50 disabled:text-ink-400',
            className,
          ].join(' ')}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});
