import { useEffect, useMemo, useState, useRef } from 'react';
import { adminService, type AdminResourceItem } from '@/services/admin';
import { catalogService } from '@/services/catalog';
import type { AcademicCatalogue } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Dialog } from '@/components/ui/Dialog';
import {
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/utils/format';

export function AdminResourcesPage() {
  const [resources, setResources] = useState<AdminResourceItem[]>([]);
  const [catalogue, setCatalogue] = useState<AcademicCatalogue | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalItem, setEditModalItem] = useState<AdminResourceItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<AdminResourceItem | null>(null);
  const [replacingFileId, setReplacingFileId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      adminService.listResources(search),
      catalogService.getAcademicCatalogue(),
    ])
      .then(([rList, cat]) => {
        setResources(rList);
        setCatalogue(cat);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load resources.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleFileReplace = async (resourceId: number, file: File) => {
    try {
      await adminService.replaceResourceFile(resourceId, file);
      loadData();
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : 'Unable to replace file.');
    } finally {
      setReplacingFileId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950">Learning Resource Management</h1>
          <p className="mt-1 text-sm text-ink-600">
            Upload course materials, manage publication states, configure public sample previews, and enforce access policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          <Button size="sm" onClick={() => setUploadModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Upload Material
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Hidden file input for file replacement */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0] && replacingFileId) {
            handleFileReplace(replacingFileId, e.target.files[0]);
          }
        }}
      />

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          type="search"
          placeholder="Search materials by title or filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      {/* Resources Table */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-ink-50 border-b border-ink-100 flex items-center justify-between text-xs font-bold text-ink-700">
          <span>{resources.length} learning resource{resources.length === 1 ? '' : 's'} recorded</span>
        </div>

        {resources.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-500">
            No learning materials match your search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50/50 border-b border-ink-100 text-xs font-bold uppercase text-ink-600">
                <tr>
                  <th className="px-4 py-3">Resource Title</th>
                  <th className="px-4 py-3">File / Size</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Access Policy</th>
                  <th className="px-4 py-3">Preview Policy</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-900">{r.title}</p>
                      {r.description && <p className="text-xs text-ink-500 line-clamp-1">{r.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600 whitespace-nowrap">
                      <p className="font-mono">{r.file_name}</p>
                      <p className="text-ink-400 mt-0.5">{(r.file_size_bytes / 1024).toFixed(0)} KB &middot; {r.mime_type}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.is_published ? 'green' : 'neutral'}>
                        {r.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <Badge tone={r.access_policy === 'public' ? 'green' : 'neutral'}>
                        {r.access_policy === 'public' ? 'Public' : 'Protected'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <Badge tone={r.preview_policy === 'public_sample' ? 'teal' : r.preview_policy === 'authenticated_only' ? 'amber' : 'neutral'}>
                        {r.preview_policy === 'public_sample' ? 'Sample Excerpt' : r.preview_policy === 'authenticated_only' ? 'Auth Preview' : 'No Preview'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplacingFileId(r.id);
                          fileInputRef.current?.click();
                        }}
                        title="Replace file bytes"
                      >
                        Replace file
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditModalItem(r)} leftIcon={<Edit2 className="h-3.5 w-3.5" />}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteModalItem(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadResourceModal
          catalogue={catalogue}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            setUploadModalOpen(false);
            loadData();
          }}
        />
      )}

      {/* Edit Metadata Modal */}
      {editModalItem && (
        <EditResourceModal
          item={editModalItem}
          onClose={() => setEditModalItem(null)}
          onSuccess={() => {
            setEditModalItem(null);
            loadData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalItem && (
        <Dialog open onClose={() => setDeleteModalItem(null)} title="Delete Learning Resource?">
          <p className="text-sm text-ink-600">
            Are you sure you want to delete <strong>{deleteModalItem.title}</strong>? If this resource is referenced by existing student entitlements or packages, the deletion will be rejected.
          </p>
          <div className="mt-6 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setDeleteModalItem(null)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                try {
                  await adminService.deleteResource(deleteModalItem.id);
                  setDeleteModalItem(null);
                  loadData();
                } catch (cause) {
                  alert(cause instanceof Error ? cause.message : 'Unable to delete resource.');
                }
              }}
            >
              Confirm delete
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function UploadResourceModal({
  catalogue,
  onClose,
  onSuccess,
}: {
  catalogue?: AcademicCatalogue | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Dependent academic selectors
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [resourceTypeId, setResourceTypeId] = useState('');
  const [accessPolicy, setAccessPolicy] = useState('subscription_or_entitlement');
  const [previewPolicy, setPreviewPolicy] = useState<'none' | 'public_sample' | 'authenticated_only'>('none');
  const [previewContent, setPreviewContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Filtered departments based on faculty
  const availableDepts = useMemo(() => {
    if (!catalogue) return [];
    return facultyId
      ? catalogue.departments.filter((d) => String(d.faculty_id) === facultyId)
      : catalogue.departments;
  }, [catalogue, facultyId]);

  // Filtered programmes based on faculty
  const availableProgrammes = useMemo(() => {
    if (!catalogue) return [];
    return facultyId
      ? catalogue.programmes.filter((p) => String(p.faculty_id) === facultyId)
      : catalogue.programmes;
  }, [catalogue, facultyId]);

  // Filtered courses based on programme or department
  const availableCourses = useMemo(() => {
    if (!catalogue) return [];
    return catalogue.courses.filter((c) => {
      const matchProg = !programmeId || String(c.programme_id) === programmeId;
      const matchDept = !departmentId || String(c.department_id) === departmentId;
      return matchProg && matchDept;
    });
  }, [catalogue, programmeId, departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErr('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setErr(null);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim() || '');
    formData.append('upload', file);
    formData.append('is_published', isPublished ? 'true' : 'false');
    formData.append('access_policy', accessPolicy);
    formData.append('preview_policy', previewPolicy);
    if (previewContent.trim()) {
      formData.append('preview_content', previewContent.trim());
    }
    if (courseId) formData.append('course_id', courseId);
    if (levelId) formData.append('academic_level_id', levelId);
    if (semesterId) formData.append('semester_id', semesterId);
    if (resourceTypeId) formData.append('resource_type_id', resourceTypeId);

    try {
      await adminService.uploadResource(formData);
      onSuccess();
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : 'Unable to upload learning resource.');
      setUploading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Upload Learning Material" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {err && <Alert tone="error">{err}</Alert>}

        <div>
          <label className="text-xs font-bold text-ink-700 block mb-1">Resource File (Max 50 MB)</label>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs text-ink-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
        </div>

        <Input label="Resource Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. CSC202 Lecture Notes: Chapter 1-4" />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Overview of topics covered, references, etc." />

        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-ink-100">
          <Select label="Resource Type" value={resourceTypeId} onChange={(e) => setResourceTypeId(e.target.value)}>
            <option value="">Select Resource Type</option>
            {catalogue?.resource_types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Select label="Access Policy" value={accessPolicy} onChange={(e) => setAccessPolicy(e.target.value)}>
            <option value="subscription_or_entitlement">Subscription or Entitlement Required</option>
            <option value="entitlement_only">Direct Entitlement Only</option>
            <option value="public">Public (Free Download)</option>
          </Select>
        </div>

        {/* Academic Hierarchy Dependent Selectors */}
        <div className="p-3 bg-ink-50 rounded-xl space-y-3">
          <p className="text-xs font-bold uppercase text-ink-600">Academic Hierarchy Alignment</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Select
              label="1. Faculty"
              value={facultyId}
              onChange={(e) => {
                setFacultyId(e.target.value);
                setDepartmentId('');
                setProgrammeId('');
                setCourseId('');
              }}
            >
              <option value="">All faculties</option>
              {catalogue?.faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>

            <Select
              label="2. Department"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setCourseId('');
              }}
            >
              <option value="">All departments</option>
              {availableDepts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Select
              label="3. Programme"
              value={programmeId}
              onChange={(e) => {
                setProgrammeId(e.target.value);
                setCourseId('');
              }}
            >
              <option value="">All programmes</option>
              {availableProgrammes.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>

            <Select
              label="4. Course Unit"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Select course unit</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {c.title}</option>
              ))}
            </Select>

            <Select label="Level" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
              <option value="">Select level</option>
              {catalogue?.levels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>

            <Select label="Semester" value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
              <option value="">Select semester</option>
              {catalogue?.semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.number === 1 ? 'First' : 'Second'} Semester</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Preview Configuration */}
        <div className="p-3 border border-ink-200 rounded-xl space-y-2.5">
          <p className="text-xs font-bold uppercase text-ink-600">Sample Preview Settings</p>
          <Select
            label="Preview Policy"
            value={previewPolicy}
            onChange={(e) => setPreviewPolicy(e.target.value as typeof previewPolicy)}
          >
            <option value="none">No Preview (Protected/Restricted)</option>
            <option value="public_sample">Public Sample Excerpt (Open to all visitors)</option>
            <option value="authenticated_only">Preview for Signed-In Students Only</option>
          </Select>

          {previewPolicy !== 'none' && (
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                Approved Sample Excerpt / Notes Summary (Rendered in preview tab)
              </label>
              <textarea
                value={previewContent}
                onChange={(e) => setPreviewContent(e.target.value)}
                rows={4}
                className="w-full text-xs font-sans rounded-xl border border-ink-200 p-2.5 focus:border-teal-500 focus:outline-none"
                placeholder="Enter approved sample notes, syllabus outline, or chapter summary to display to students..."
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="publish-toggle"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="publish-toggle" className="text-xs font-bold text-ink-800">
            Publish immediately (visible to students)
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-ink-100">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={uploading} leftIcon={<Upload className="h-4 w-4" />}>
            Upload Material
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function EditResourceModal({
  item,
  onClose,
  onSuccess,
}: {
  item: AdminResourceItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [isPublished, setIsPublished] = useState(item.is_published);
  const [accessPolicy, setAccessPolicy] = useState(item.access_policy);
  const [previewPolicy, setPreviewPolicy] = useState<'none' | 'public_sample' | 'authenticated_only'>(item.preview_policy ?? 'none');
  const [previewContent, setPreviewContent] = useState(item.preview_content ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await adminService.updateResource(item.id, {
        title: title.trim(),
        description: description.trim() || null,
        is_published: isPublished,
        access_policy: accessPolicy,
        preview_policy: previewPolicy,
        preview_content: previewContent.trim() || null,
      });
      onSuccess();
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : 'Unable to update resource.');
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title={`Edit Material: ${item.file_name}`} size="md">
      <form onSubmit={save} className="space-y-4">
        {err && <Alert tone="error">{err}</Alert>}

        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        <Select label="Access Policy" value={accessPolicy} onChange={(e) => setAccessPolicy(e.target.value)}>
          <option value="subscription_or_entitlement">Subscription or Entitlement Required</option>
          <option value="entitlement_only">Direct Entitlement Only</option>
          <option value="public">Public Access</option>
        </Select>

        <Select
          label="Preview Policy"
          value={previewPolicy}
          onChange={(e) => setPreviewPolicy(e.target.value as typeof previewPolicy)}
        >
          <option value="none">No Preview (Protected/Restricted)</option>
          <option value="public_sample">Public Sample Excerpt (Open to all visitors)</option>
          <option value="authenticated_only">Preview for Signed-In Students Only</option>
        </Select>

        {previewPolicy !== 'none' && (
          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1">
              Sample Excerpt / Key Formulas Notes
            </label>
            <textarea
              value={previewContent}
              onChange={(e) => setPreviewContent(e.target.value)}
              rows={4}
              className="w-full text-xs font-sans rounded-xl border border-ink-200 p-2.5 focus:border-teal-500 focus:outline-none"
              placeholder="Enter approved sample notes or excerpt to display to students..."
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-publish-toggle"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="edit-publish-toggle" className="text-xs font-bold text-ink-800">
            Resource is Published
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-ink-100">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save changes</Button>
        </div>
      </form>
    </Dialog>
  );
}
