import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';

interface ProtectedActionDialogProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  destination?: string; // path to return to after auth
  actionLabel?: string;
}

export function ProtectedActionDialog({ open, onClose, reason, destination, actionLabel = 'Read full material' }: ProtectedActionDialogProps) {
  const navigate = useNavigate();
  const redirect = destination ? encodeURIComponent(destination) : undefined;

  const goLogin = () => {
    onClose();
    navigate(redirect ? `/login?redirect=${redirect}` : '/login');
  };
  const goRegister = () => {
    onClose();
    navigate(redirect ? `/register?redirect=${redirect}` : '/register');
  };

  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-ink-900">{actionLabel} requires an account</h2>
        <p className="mt-2 text-sm text-ink-600">{reason}</p>
      </div>
      <div className="mt-5 space-y-2.5">
        <Button fullWidth onClick={goLogin} leftIcon={<ArrowRight className="h-4 w-4" />}>
          Sign in to continue
        </Button>
        <Button fullWidth variant="outline" onClick={goRegister} leftIcon={<Sparkles className="h-4 w-4" />}>
          Create an account
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-ink-400">
        Signing in does not automatically grant paid access. A semester subscription may still be required.
      </p>
    </Dialog>
  );
}
