import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && (
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
