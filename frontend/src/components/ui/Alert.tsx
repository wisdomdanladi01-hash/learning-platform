import type { ReactNode } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'error';

const tones: Record<Tone, { wrap: string; title: string }> = {
  info: { wrap: 'bg-blue-50 border-blue-200 text-blue-900', title: 'text-blue-900' },
  success: { wrap: 'bg-green-50 border-green-200 text-green-900', title: 'text-green-900' },
  warning: { wrap: 'bg-amber-50 border-amber-200 text-amber-900', title: 'text-amber-900' },
  error: { wrap: 'bg-red-50 border-red-200 text-red-900', title: 'text-red-900' },
};

export function Alert({ tone = 'info', title, children, className = '' }: { tone?: Tone; title?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone].wrap} ${className}`}>
      {title && <p className={`font-semibold text-sm ${tones[tone].title}`}>{title}</p>}
      {children && <div className={`text-sm ${title ? 'mt-1' : ''} opacity-90`}>{children}</div>}
    </div>
  );
}
