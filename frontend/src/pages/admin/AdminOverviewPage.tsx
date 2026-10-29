import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/admin';
import type { AdminOverview } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  FileText,
  UserCheck,
  BookOpen,
  GraduationCap,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '@/utils/format';

export function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminService
      .getOverview()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load overview.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950">Administrator Dashboard</h1>
          <p className="mt-1 text-sm text-ink-600">
            Real-time operational summary of academic directory, resources, and verifications.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Refresh data
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          title="Published Resources"
          value={metrics ? `${metrics.published_resources} / ${metrics.total_resources}` : '—'}
          subtitle="Total files in repository"
          icon={FileText}
          tone="teal"
          link="/admin/resources"
        />
        <MetricCard
          title="Pending Verifications"
          value={metrics ? String(metrics.pending_verifications) : '—'}
          subtitle="Students awaiting review"
          icon={UserCheck}
          tone={metrics && metrics.pending_verifications > 0 ? 'amber' : 'green'}
          link="/admin/verification"
        />
        <MetricCard
          title="Course Offerings"
          value={metrics ? String(metrics.total_course_offerings) : '—'}
          subtitle={metrics ? `${metrics.verified_offerings} verified, ${metrics.unverified_offerings} unverified` : ''}
          icon={BookOpen}
          tone="blue"
          link="/admin/courses"
        />
        <MetricCard
          title="Programmes"
          value={metrics ? String(metrics.total_programmes) : '—'}
          subtitle={metrics ? `${metrics.total_faculties} faculties, ${metrics.total_departments} depts` : ''}
          icon={GraduationCap}
          tone="neutral"
          link="/admin/academic"
        />
        <MetricCard
          title="Access Packages"
          value={metrics ? String(metrics.total_packages) : '—'}
          subtitle="Configured semester plans"
          icon={CreditCard}
          tone="neutral"
          link="/admin/packages"
        />
        <MetricCard
          title="Succeeded Payments"
          value={metrics ? `${metrics.succeeded_payments} / ${metrics.total_payments}` : '—'}
          subtitle="Verified by backend"
          icon={ShieldCheck}
          tone="green"
          link="/admin/packages"
        />
      </div>

      {/* Quick Action Banner */}
      <Card className="p-5 bg-gradient-to-r from-ink-900 to-ink-950 text-white border-0 shadow-card">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Curriculum &amp; Course Unit Management</h2>
            <p className="mt-1 text-sm text-ink-300 max-w-2xl">
              Import course offerings via CSV or manage individual unit verification statuses and curriculum versions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/admin/import">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" leftIcon={<FileSpreadsheet className="h-4 w-4" />}>
                Import CSV offerings
              </Button>
            </Link>
            <Link to="/admin/resources">
              <Button size="sm" variant="outline" className="bg-transparent text-white border-white/20 hover:bg-white/10" leftIcon={<FileText className="h-4 w-4" />}>
                Upload resource
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Activity Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Resources */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-ink-950">Recent Learning Resources</h2>
            <Link to="/admin/resources" className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data?.recent_resources.length === 0 ? (
            <p className="text-sm text-ink-500 py-4 text-center">No learning materials have been uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {data?.recent_resources.map((r) => (
                <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-ink-900 truncate">{r.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{r.file_name} &middot; Added {formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge tone={r.is_published ? 'green' : 'neutral'}>
                      {r.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge tone={r.preview_policy === 'public_sample' ? 'teal' : r.preview_policy === 'authenticated_only' ? 'amber' : 'neutral'}>
                      {r.preview_policy === 'public_sample' ? 'Public sample' : r.preview_policy === 'authenticated_only' ? 'Auth preview' : 'No preview'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Verification Submissions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-ink-950">Recent Student Submissions</h2>
            <Link to="/admin/verification" className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
              Review queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data?.recent_submissions.length === 0 ? (
            <p className="text-sm text-ink-500 py-4 text-center">No student verification submissions recorded.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {data?.recent_submissions.map((s) => (
                <li key={s.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-ink-900">
                      {s.matriculation_number || s.jamb_registration_number || `Student ID ${s.user_id}`}
                    </p>
                    <p className="text-xs text-ink-500 mt-0.5">Submitted {formatDate(s.created_at)}</p>
                  </div>
                  <Badge tone={s.status === 'approved' ? 'green' : s.status === 'pending' ? 'amber' : 'red'}>
                    {s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  link,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'teal' | 'amber' | 'green' | 'blue' | 'neutral';
  link: string;
}) {
  const toneClasses = {
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    neutral: 'bg-ink-100 text-ink-700',
  }[tone];

  return (
    <Link to={link}>
      <Card className="p-4 h-full hover:border-teal-200 hover:shadow-pop transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-ink-500 truncate">{title}</span>
          <div className={`h-8 w-8 rounded-lg inline-flex items-center justify-center shrink-0 ${toneClasses}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 font-display text-2xl font-bold text-ink-950">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-ink-500 truncate">{subtitle}</p>}
      </Card>
    </Link>
  );
}
