import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalogService } from '@/services/catalog';
import { useAuth } from '@/auth/AuthContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { downloadResource } from '@/services/api';
import type { CatalogResource } from '@/services/catalog';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ProtectedActionDialog } from '@/components/ProtectedActionDialog';
import { ResourceCard } from '@/components/ResourceCard';
import { ArrowLeft, Lock, Download, ListChecks, ShieldCheck, FileText, Tag, ChevronRight } from 'lucide-react';
import { formatRelative } from '@/utils/format';

export function ResourceDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const recentlyViewed = useRecentlyViewed();
  const [authDialog, setAuthDialog] = useState(false);
  const [resource, setResource] = useState<CatalogResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    catalogService.getResource(id)
      .then((item) => {
        if (!active) return;
        if (!item) setError('This learning material is unavailable.');
        else {
          setResource(item);
          recentlyViewed.add(item.id);
        }
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load this learning material.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [related, setRelated] = useState<CatalogResource[]>([]);
  useEffect(() => {
    if (!resource) return;
    let active = true;
    catalogService.getRelatedResources(resource.id)
      .then((items) => { if (active) setRelated(items); })
      .catch(() => { if (active) setRelated([]); });
    return () => { active = false; };
  }, [resource]);

  if (loading) {
    return <div className="container-page py-16 text-sm text-ink-600">Loading learning material…</div>;
  }
  if (!resource || error) {
    return (
      <div className="container-page py-16">
        <Alert tone="error" title="Learning material unavailable">{error ?? 'This learning material is unavailable.'}</Alert>
        <div className="mt-4">
          <Link to="/materials"><Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to materials</Button></Link>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!profile) {
      setAuthDialog(true);
      return;
    }
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadResource(resource.id);
    } catch (cause) {
      setDownloadError(cause instanceof Error ? cause.message : 'Unable to download this learning material.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-page py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ink-500 mb-5" aria-label="Breadcrumb">
        <Link to="/materials" className="hover:text-teal-700 inline-flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Materials</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-ink-700">{resource.course.code}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge tone="teal">{resource.type}</Badge>
            <Badge tone="neutral">Level {resource.level}</Badge>
            <Badge tone="neutral">{resource.semester} semester</Badge>
            <Badge tone="neutral">{resource.accessPolicy === 'public' ? <Download className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {resource.accessPolicy === 'public' ? 'Public access' : 'Access controlled'}</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-950 text-balance">{resource.title}</h1>
          <p className="mt-2 text-sm font-semibold text-ink-600">
            <Link to={`/materials?q=${encodeURIComponent(resource.course.code)}`} className="hover:text-teal-700">
              {resource.course.code} &middot; {resource.course.title}
            </Link>
          </p>

          <p className="mt-4 text-ink-700 leading-relaxed">{resource.description}</p>

          {resource.authorTag && (
            <p className="mt-3 text-xs text-ink-500 italic">{resource.authorTag}</p>
          )}

          {/* Preview status */}
          <section className="mt-7">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-lg font-bold text-ink-950">Preview</h2>
            </div>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-ink-50 border-b border-ink-100">
                <span className="text-xs font-semibold text-ink-600 inline-flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Resource information
                </span>
                <span className="text-xs text-ink-400">No preview provided</span>
              </div>
              <div className="p-5 sm:p-7 bg-white">
                <p className="text-sm text-ink-600">No preview has been published for this item. You can view its details and request access to the full resource.</p>
              </div>
            </Card>
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-lg font-bold text-ink-950 mb-4">Related resources for {resource.course.code}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {related.map((r) => (
                  <ResourceCard key={r.id} resource={r} course={r.course} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky actions sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-950">Access this resource</h3>
            <p className="mt-1 text-sm text-ink-600">
              {profile
                ? profile.hasSubscription
                  ? 'Your semester subscription is active. You can read the full material.'
                  : "You're signed in. Add a semester subscription to unlock the full material."
                : 'Sign in to unlock the full material. A semester subscription may also be required.'}
            </p>
            <div className="mt-4 space-y-2.5">
              <Button fullWidth variant="outline" onClick={handleDownload} loading={downloading} leftIcon={<Download className="h-4 w-4" />}>
                Download material
              </Button>
              <Link to={`/practice?course=${resource.course.id}`}>
                <Button fullWidth variant="ghost" leftIcon={<ListChecks className="h-4 w-4" />}>
                  Practise related questions
                </Button>
              </Link>
            </div>

            {downloadError && (
              <Alert tone="warning" className="mt-4">
                <p className="text-sm">{downloadError}</p>
                <Link to="/pricing" className="mt-2 inline-block"><Button size="sm" leftIcon={<Tag className="h-3.5 w-3.5" />}>View packages</Button></Link>
              </Alert>
            )}
            {!profile && (
              <p className="mt-3 text-xs text-ink-500">
                You&apos;re browsing as a visitor. Signing in does not automatically grant paid access.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-950 text-sm">Resource details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Course" value={`${resource.course.code} · ${resource.course.title}`} />
              <Row label="Type" value={resource.type} />
              <Row label="Level" value={`Level ${resource.level}`} />
              <Row label="Semester" value={resource.semester} />
              <Row label="File size" value={formatFileSize(resource.fileSizeBytes)} />
              <Row label="Added" value={formatRelative(resource.uploadedAt)} />
              <Row label="Content preview" value="Not provided" />
            </dl>
            <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap gap-1.5">
            </div>
          </Card>

          <Card className="p-5 bg-ink-950 text-white border-ink-950">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-teal-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">How access works</p>
                <p className="text-xs text-ink-300 mt-1">The service checks your account and entitlements before granting access to a protected download.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <ProtectedActionDialog
        open={authDialog}
        onClose={() => setAuthDialog(false)}
        reason="Sign in to download this learning material. Your subscription and verification status will be checked by the service."
        destination={`/materials/${resource.id}`}
      />
    </div>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Not provided';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-500 shrink-0">{label}</dt>
      <dd className="text-ink-900 font-medium text-right">{value}</dd>
    </div>
  );
}
