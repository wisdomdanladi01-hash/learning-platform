import type { ReactNode } from 'react';

type Tone = 'neutral' | 'teal' | 'amber' | 'ink' | 'green' | 'red' | 'blue';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  teal: 'bg-teal-100 text-teal-800',
  amber: 'bg-amber-100 text-amber-800',
  ink: 'bg-ink-900 text-white',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-800',
};

export function Badge({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
