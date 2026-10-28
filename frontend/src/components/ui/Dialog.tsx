import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

export function Dialog({ open, onClose, title, description, children, footer, size = 'md', closeOnBackdrop = true }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={`relative w-full ${widths[size]} bg-white shadow-pop animate-slide-up sm:animate-scale-in rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-ink-100">
            <div>
              {title && <h2 className="text-lg font-bold text-ink-900">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 -mt-1 -mr-1 h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-ink-100 bg-ink-50/50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
