import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-soft',
  secondary: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-soft',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 active:bg-ink-200',
  outline: 'bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 active:bg-ink-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-soft',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-4 text-[0.9375rem] rounded-xl gap-2',
  lg: 'h-13 px-6 text-base rounded-xl gap-2 py-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leftIcon, rightIcon, loading, fullWidth, className = '', children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold transition-colors duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
