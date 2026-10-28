import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { paymentService, type PaymentRecord } from '@/services/payments';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { History, ArrowRight, Receipt } from 'lucide-react';
import { formatDateTime } from '@/utils/format';

export function PaymentsPage() {
  const { profile } = useAuth();
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    let active = true;
    paymentService.getPaymentHistory()
      .then((items) => { if (active) setHistory(items); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load payment history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [profile]);

  if (!profile) {
    return (
      <div className="container-page py-16 max-w-md">
        <Alert tone="info" title="Sign in to see your payments"><p className="text-sm">Payment history is only available when you're signed in.</p></Alert>
        <div className="mt-4"><Link to="/login?redirect=%2Fpayments"><Button>Sign in</Button></Link></div>
      </div>
    );
  }

  const statusTone = (status: string) => status === 'succeeded' ? 'green' : status === 'pending' ? 'amber' : 'red';

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-950">Payment history</h1>
        <p className="mt-1.5 text-sm text-ink-600">Transactions recorded for your account.</p>
      </div>
      {error && <Alert tone="error" className="mb-5">{error}</Alert>}
      {loading ? <Card className="p-5 text-sm text-ink-600">Loading payment history…</Card> : history.length === 0 ? (
        <Card><EmptyState icon={<Receipt className="h-7 w-7" />} title="No payments yet" description="Completed or pending transactions will appear here." action={<Link to="/pricing"><Button leftIcon={<ArrowRight className="h-4 w-4" />}>View packages</Button></Link>} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {history.map((payment) => (
              <li key={payment.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">{payment.package?.name ?? 'Subscription payment'}</p>
                  <p className="text-xs text-ink-500 mt-0.5 font-mono break-all">{payment.provider_reference ?? `Payment ${payment.id}`}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{formatDateTime(payment.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-display font-bold text-ink-950">{formatMoney(payment.amount_minor, payment.currency)}</span>
                  <Badge tone={statusTone(payment.status)}>{payment.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div className="mt-6"><Link to="/dashboard"><Button variant="outline" leftIcon={<History className="h-4 w-4" />}>Back to dashboard</Button></Link></div>
    </div>
  );
}

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amountMinor / 100);
}
