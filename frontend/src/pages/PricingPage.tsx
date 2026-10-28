import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { paymentService, type SubscriptionPackage } from '@/services/payments';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Check, ShieldCheck, CreditCard, Tag, ArrowRight, Lock, Info } from 'lucide-react';

export function PricingPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    paymentService.listPackages()
      .then((items) => { if (active) setPackages(items); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load subscription packages.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const startCheckout = async (item: SubscriptionPackage) => {
    if (!profile) {
      navigate(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }
    setProcessingId(item.id);
    setError(null);
    try {
      const checkout = await paymentService.initializePayment(item.id);
      window.location.assign(checkout.checkout_url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start checkout.');
      setProcessingId(null);
      await refreshProfile();
    }
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="text-center max-w-2xl mx-auto">
        <Badge tone="teal" className="mb-3"><Tag className="h-3 w-3" /> Pricing</Badge>
        <h1 className="font-display text-3xl font-bold text-ink-950 text-balance">Semester access packages</h1>
        <p className="mt-3 text-ink-600">Package names, prices, and availability come from the Study Hub service.</p>
      </div>

      <div className="mt-10 max-w-3xl mx-auto space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        {loading ? <Card className="p-6 text-sm text-ink-600">Loading available packages…</Card> : packages.length === 0 ? (
          <Card className="p-7"><Alert tone="info" title="No packages available"><p className="text-sm">Subscription packages will appear here when they are configured.</p></Alert></Card>
        ) : packages.map((item) => (
          <Card key={item.id} className="overflow-hidden border-teal-100 shadow-pop">
            <div className="p-7 sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-950">{item.name}</h2>
                  <p className="mt-1 text-sm text-ink-600">{formatDuration(item.duration_days)}</p>
                </div>
                <Badge tone="teal">Semester package</Badge>
              </div>
              <p className="mt-5 font-display text-4xl font-extrabold text-ink-950">{formatMoney(item.price_minor, item.currency)}</p>
              {item.description && <p className="mt-4 text-sm text-ink-700">{item.description}</p>}
              <ul className="mt-6 space-y-2.5">
                <li className="flex items-start gap-2.5 text-sm text-ink-800"><Check className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" /> Access is subject to the package terms and resource entitlements.</li>
                <li className="flex items-start gap-2.5 text-sm text-ink-800"><ShieldCheck className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" /> Payment confirmation is verified by the backend.</li>
              </ul>
            </div>
            <div className="px-7 sm:px-9 py-5 bg-ink-50 border-t border-ink-100">
              {profile?.hasSubscription ? (
                <Alert tone="success"><p className="text-sm font-semibold">Your subscription is active</p><p className="text-sm mt-0.5">Your current access is managed by the service.</p></Alert>
              ) : profile ? (
                <Button size="lg" fullWidth onClick={() => void startCheckout(item)} loading={processingId === item.id} leftIcon={<CreditCard className="h-5 w-5" />} rightIcon={<ArrowRight className="h-4 w-4" />}>Continue to secure checkout</Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <Alert tone="info" className="flex-1"><p className="text-sm">Sign in to purchase this package.</p></Alert>
                  <Link to={`/login?redirect=${encodeURIComponent('/pricing')}`}><Button size="lg" leftIcon={<Lock className="h-4 w-4" />}>Sign in to continue</Button></Link>
                </div>
              )}
            </div>
          </Card>
        ))}

        <Card className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-ink-500 mt-0.5 shrink-0" />
          <p className="text-sm text-ink-700">Only packages and prices returned by the backend are shown. Resource access is checked separately by the backend.</p>
        </Card>
      </div>
    </div>
  );
}

function formatDuration(days: number): string {
  if (days <= 0) return 'Duration set by academic semester';
  return `${days} day${days === 1 ? '' : 's'}`;
}

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amountMinor / 100);
}
