import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

const baseField =
  'w-full rounded-xl border bg-white text-ink-900 placeholder:text-ink-400 transition-colors ' +
  'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 focus:outline-none ' +
  'disabled:bg-ink-50 disabled:text-ink-400';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightSlot, id, className = '', ...rest },
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
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={[
            baseField,
            'h-11 px-3.5 text-[0.9375rem]',
            leftIcon ? 'pl-10' : '',
            rightSlot ? 'pr-12' : '',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : 'border-ink-200',
            className,
          ].join(' ')}
          {...rest}
        />
        {rightSlot && <span className="absolute inset-y-0 right-0 flex items-center pr-2">{rightSlot}</span>}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className = '', rows = 4, ...rest },
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={[
          baseField, 'px-3.5 py-2.5 text-[0.9375rem]',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : 'border-ink-200',
          className,
        ].join(' ')}
        {...rest}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, Omit<FieldProps, 'leftIcon' | 'rightSlot'> {}
