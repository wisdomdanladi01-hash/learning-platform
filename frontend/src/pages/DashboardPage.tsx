import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, describeAcademic } from '@/auth/AuthContext';
import { catalogService, type CatalogResource } from '@/services/catalog';
import { paymentService, type PaymentRecord } from '@/services/payments';
import { apiRequest } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ResourceCard } from '@/components/ResourceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen, CreditCard, Clock, ArrowRight, History, User, GraduationCap, Tag, ListChecks } from 'lucide-react';
import { formatDate } from '@/utils/format';

interface DashboardResponse {
  verification: { status: string };
  subscription: { status: string; is_active: boolean; ends_at: string } | null;
}

export function DashboardPage() {
  const { profile, isLoading, token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [materials, setMaterials] = useState<CatalogResource[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !token) {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([
      apiRequest<DashboardResponse>('/dashboard', {}, token),
      catalogService.featuredResources(3),
      paymentService.getPaymentHistory(),
    ]).then(([data, resourceItems, paymentItems]) => {
      if (!active) return;
      setDashboard(data);
      setMaterials(resourceItems);
      setPayments(paymentItems);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Unable to load your dashboard.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [profile, token]);

  if (isLoading || loading) {
    return <div className="container-page py-16 text-sm text-ink-600">Loading your Study Hub dashboard…</div>;
  }

  if (!profile) {
    return (
      <div className="container-page py-16 max-w-md">
        <Alert tone="info" title="Sign in to see your dashboard">
          <p className="text-sm">Your study dashboard is available after you sign in.</p>
        </Alert>
        <div className="mt-4 flex gap-3">
          <Link to="/login"><Button>Sign in</Button></Link>
          <Link to="/register"><Button variant="outline">Create account</Button></Link>
        </div>
      </div>
    );
  }

  const hasSubscription = dashboard?.subscription?.is_active ?? profile.hasSubscription;
  const expiry = dashboard?.subscription?.ends_at ?? profile.subscriptionExpiresAt;

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-950">Welcome back, {profile.fullName.split(' ')[0]}</h1>
        <p className="mt-1.5 text-sm text-ink-600 inline-flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-ink-400" /> {describeAcademic(profile)}
        </p>
      </div>

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-ink-950">Subscription status</h2>
                {hasSubscription ? (
                  <>
                    <p className="mt-1 text-sm text-ink-700">Your semester subscription is active.</p>
                    {expiry && <p className="mt-1 text-xs text-ink-500 inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Active until {formatDate(expiry)}</p>}
                  </>
                ) : <p className="mt-1 text-sm text-ink-700">No active subscription is associated with your account.</p>}
              </div>
              <Badge tone={hasSubscription ? 'green' : 'amber'}>{hasSubscription ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {!hasSubscription && <Link to="/pricing"><Button leftIcon={<Tag className="h-4 w-4" />}>View packages</Button></Link>}
              {payments.length > 0 && <Link to="/payments"><Button variant="outline" leftIcon={<History className="h-4 w-4" />}>Payment history</Button></Link>}
            </div>
          </Card>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-ink-950">Available learning materials</h2>
              <Link to="/materials" className="text-sm font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">Browse all <ArrowRight className="h-4 w-4" /></Link>
            </div>
            {materials.length === 0 ? (
              <Card><EmptyState icon={<BookOpen className="h-7 w-7" />} title="No published materials yet" description="Published resources for your courses will appear here." action={<Link to="/materials"><Button leftIcon={<BookOpen className="h-4 w-4" />}>Explore materials</Button></Link>} /></Card>
            ) : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{materials.map((resource) => <ResourceCard key={resource.id} resource={resource} course={resource.course} />)}</div>}
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-950">Quick actions</h3>
            <div className="mt-3 space-y-2">
              <QuickLink to="/materials" icon={<BookOpen className="h-4 w-4 text-teal-600" />} label="Learning materials" />
              <QuickLink to="/practice" icon={<ListChecks className="h-4 w-4 text-teal-600" />} label="Practice tests" />
              <QuickLink to="/pricing" icon={<CreditCard className="h-4 w-4 text-teal-600" />} label="Subscription packages" />
              <QuickLink to="/profile" icon={<User className="h-4 w-4 text-teal-600" />} label="Profile & settings" />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-950">Student verification</h3>
            <p className="mt-2 text-sm text-ink-600">Current status: <strong className="capitalize text-ink-900">{dashboard?.verification.status ?? 'Unavailable'}</strong></p>
            <Link to="/onboarding"><Button variant="outline" size="sm" className="mt-3">View academic details</Button></Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50">
      <span className="inline-flex items-center gap-2">{icon}{label}</span>
      <ArrowRight className="h-4 w-4 text-ink-400" />
    </Link>
  );
}
