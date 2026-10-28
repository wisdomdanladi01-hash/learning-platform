import type { ReactNode } from 'react';

export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: React.ElementType }) {
  return (
    <Tag className={`bg-white rounded-2xl border border-ink-100 shadow-card ${className}`}>
      {children}
    </Tag>
  );
}
