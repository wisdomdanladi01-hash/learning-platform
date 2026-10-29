import { useEffect, useState } from 'react';
import { adminService, type AdminDepartment, type AdminFaculty, type AdminProgramme } from '@/services/admin';
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
  Edit2,
  RefreshCw,
} from 'lucide-react';

export function AdminAcademicPage() {
  const [tab, setTab] = useState<'faculties' | 'departments' | 'programmes'>('faculties');
  const [faculties, setFaculties] = useState<AdminFaculty[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [programmes, setProgrammes] = useState<AdminProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [facultyModal, setFacultyModal] = useState<{ open: boolean; item: AdminFaculty | null }>({ open: false, item: null });
  const [deptModal, setDeptModal] = useState<{ open: boolean; item: AdminDepartment | null }>({ open: false, item: null });
  const [progModal, setProgModal] = useState<{ open: boolean; item: AdminProgramme | null }>({ open: false, item: null });

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      adminService.listFaculties(),
      adminService.listDepartments(),
      adminService.listProgrammes(),
    ])
      .then(([f, d, p]) => {
        setFaculties(f);
        setDepartments(d);
        setProgrammes(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load academic directory.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950">Academic Directory</h1>
          <p className="mt-1 text-sm text-ink-600">
            Manage institutions, faculties, departments, and degree programmes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} loading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          {tab === 'faculties' && (
            <Button size="sm" onClick={() => setFacultyModal({ open: true, item: null })} leftIcon={<Plus className="h-4 w-4" />}>
              Add Faculty
            </Button>
          )}
          {tab === 'departments' && (
            <Button size="sm" onClick={() => setDeptModal({ open: true, item: null })} leftIcon={<Plus className="h-4 w-4" />}>
              Add Department
            </Button>
          )}
          {tab === 'programmes' && (
            <Button size="sm" onClick={() => setProgModal({ open: true, item: null })} leftIcon={<Plus className="h-4 w-4" />}>
              Add Programme
            </Button>
          )}
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Tabs */}
      <div className="border-b border-ink-200 flex gap-2">
        <button
          onClick={() => { setTab('faculties'); setSearch(''); }}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors ${
            tab === 'faculties'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
        >
          Faculties ({faculties.length})
        </button>
        <button
          onClick={() => { setTab('departments'); setSearch(''); }}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors ${
            tab === 'departments'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
        >
          Departments ({departments.length})
        </button>
        <button
          onClick={() => { setTab('programmes'); setSearch(''); }}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors ${
            tab === 'programmes'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
        >
          Programmes ({programmes.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="search"
            placeholder={`Search ${tab} by name or code…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        {(tab === 'departments' || tab === 'programmes') && (
          <Select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)} className="sm:w-60">
            <option value="">All faculties</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        )}
        {tab === 'programmes' && (
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-48">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="approved_not_commenced">Approved (not commenced)</option>
            <option value="pending_confirmation">Pending confirmation</option>
            <option value="inactive">Inactive</option>
          </Select>
        )}
      </div>

      {/* Tables based on selected tab */}
      {tab === 'faculties' && (
        <FacultiesTable
          items={faculties.filter((f) =>
            !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.code.toLowerCase().includes(search.toLowerCase())
          )}
          onEdit={(item) => setFacultyModal({ open: true, item })}
        />
      )}

      {tab === 'departments' && (
        <DepartmentsTable
          items={departments.filter((d) => {
            const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase());
            const matchesFaculty = !facultyFilter || String(d.faculty_id) === facultyFilter;
            return matchesSearch && matchesFaculty;
          })}
          faculties={faculties}
          onEdit={(item) => setDeptModal({ open: true, item })}
        />
      )}

      {tab === 'programmes' && (
        <ProgrammesTable
          items={programmes.filter((p) => {
            const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
            const matchesFaculty = !facultyFilter || String(p.faculty_id) === facultyFilter;
            const matchesStatus = !statusFilter || p.status === statusFilter;
            return matchesSearch && matchesFaculty && matchesStatus;
          })}
          faculties={faculties}
          onEdit={(item) => setProgModal({ open: true, item })}
        />
      )}

      {/* Modals for Create / Edit */}
      {facultyModal.open && (
        <FacultyFormModal
          item={facultyModal.item}
          onClose={() => setFacultyModal({ open: false, item: null })}
          onSuccess={() => { setFacultyModal({ open: false, item: null }); loadData(); }}
        />
      )}

      {deptModal.open && (
        <DepartmentFormModal
          item={deptModal.item}
          faculties={faculties}
          programmes={programmes}
          onClose={() => setDeptModal({ open: false, item: null })}
          onSuccess={() => { setDeptModal({ open: false, item: null }); loadData(); }}
        />
      )}

      {progModal.open && (
        <ProgrammeFormModal
          item={progModal.item}
          faculties={faculties}
          onClose={() => setProgModal({ open: false, item: null })}
          onSuccess={() => { setProgModal({ open: false, item: null }); loadData(); }}
        />
      )}
    </div>
  );
}

function FacultiesTable({ items, onEdit }: { items: AdminFaculty[]; onEdit: (f: AdminFaculty) => void }) {
  if (items.length === 0) return <Card className="p-8 text-center text-sm text-ink-500">No faculties match criteria.</Card>;
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-50 border-b border-ink-100 text-xs font-bold uppercase text-ink-600">
            <tr>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Faculty Name</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((f) => (
              <tr key={f.id} className="hover:bg-ink-50/50">
                <td className="px-5 py-3.5 font-mono text-xs font-bold text-ink-700">{f.code}</td>
                <td className="px-5 py-3.5 font-semibold text-ink-900">{f.name}</td>
                <td className="px-5 py-3.5">
                  <Badge tone={f.is_active ? 'green' : 'neutral'}>{f.is_active ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(f)} leftIcon={<Edit2 className="h-3.5 w-3.5" />}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DepartmentsTable({
  items,
  faculties,
  onEdit,
}: {
  items: AdminDepartment[];
  faculties: AdminFaculty[];
  onEdit: (d: AdminDepartment) => void;
}) {
  if (items.length === 0) return <Card className="p-8 text-center text-sm text-ink-500">No departments match criteria.</Card>;
  const facultyMap = new Map(faculties.map((f) => [f.id, f.name]));
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-50 border-b border-ink-100 text-xs font-bold uppercase text-ink-600">
            <tr>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Department Name</th>
              <th className="px-5 py-3.5">Faculty</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((d) => (
              <tr key={d.id} className="hover:bg-ink-50/50">
                <td className="px-5 py-3.5 font-mono text-xs font-bold text-ink-700">{d.code}</td>
                <td className="px-5 py-3.5 font-semibold text-ink-900">{d.name}</td>
                <td className="px-5 py-3.5 text-xs text-ink-600">
                  {d.faculty_id ? facultyMap.get(d.faculty_id) ?? `Faculty ${d.faculty_id}` : <span className="italic text-ink-400">Unassigned</span>}
                </td>
                <td className="px-5 py-3.5">
                  <Badge tone={d.status === 'active' ? 'green' : 'amber'}>{d.status}</Badge>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(d)} leftIcon={<Edit2 className="h-3.5 w-3.5" />}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ProgrammesTable({
  items,
  faculties,
  onEdit,
}: {
  items: AdminProgramme[];
  faculties: AdminFaculty[];
  onEdit: (p: AdminProgramme) => void;
}) {
  if (items.length === 0) return <Card className="p-8 text-center text-sm text-ink-500">No programmes match criteria.</Card>;
  const facultyMap = new Map(faculties.map((f) => [f.id, f.name]));
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-50 border-b border-ink-100 text-xs font-bold uppercase text-ink-600">
            <tr>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Programme Title</th>
              <th className="px-5 py-3.5">Award / Level</th>
              <th className="px-5 py-3.5">Faculty</th>
              <th className="px-5 py-3.5">Verification Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-ink-50/50">
                <td className="px-5 py-3.5 font-mono text-xs font-bold text-ink-700">{p.code}</td>
                <td className="px-5 py-3.5 font-semibold text-ink-900">{p.name}</td>
                <td className="px-5 py-3.5 text-xs text-ink-600">
                  {p.award ? `${p.award} · ` : ''}{p.study_level}
                </td>
                <td className="px-5 py-3.5 text-xs text-ink-600">
                  {p.faculty_id ? facultyMap.get(p.faculty_id) ?? `Faculty ${p.faculty_id}` : <span className="italic text-amber-700">Pending Assignment</span>}
                </td>
                <td className="px-5 py-3.5">
                  <Badge tone={p.status === 'active' ? 'green' : p.status === 'approved_not_commenced' ? 'blue' : 'amber'}>
                    {p.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(p)} leftIcon={<Edit2 className="h-3.5 w-3.5" />}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FacultyFormModal({ item, onClose, onSuccess }: { item: AdminFaculty | null; onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      if (item) {
        await adminService.updateFaculty(item.id, { name: name.trim() });
      } else {
        await adminService.createFaculty({ code: code.trim(), name: name.trim() });
      }
      onSuccess();
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : 'Unable to save faculty.');
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title={item ? 'Edit Faculty' : 'Add Faculty'}>
      <form onSubmit={save} className="space-y-4">
        {err && <Alert tone="error">{err}</Alert>}
        <Input label="Faculty code" value={code} onChange={(e) => setCode(e.target.value)} disabled={Boolean(item)} required placeholder="e.g. science" />
        <Input label="Faculty name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Faculty of Science" />
        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save faculty</Button>
        </div>
      </form>
    </Dialog>
  );
}

function DepartmentFormModal({
  item,
  faculties,
  onClose,
  onSuccess,
}: {
  item: AdminDepartment | null;
  faculties: AdminFaculty[];
  programmes: AdminProgramme[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [facultyId, setFacultyId] = useState(item?.faculty_id ? String(item.faculty_id) : '');
  const [status, setStatus] = useState(item?.status ?? 'active');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      if (item) {
        await adminService.updateDepartment(item.id, {
          name: name.trim(),
          faculty_id: facultyId ? Number(facultyId) : null,
          status,
        });
      } else {
        await adminService.createDepartment({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          faculty_id: facultyId ? Number(facultyId) : null,
          status,
        });
      }
      onSuccess();
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : 'Unable to save department.');
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title={item ? 'Edit Department' : 'Add Department'}>
      <form onSubmit={save} className="space-y-4">
        {err && <Alert tone="error">{err}</Alert>}
        <Input label="Department code" value={code} onChange={(e) => setCode(e.target.value)} disabled={Boolean(item)} required placeholder="e.g. COMPUTER-SCIENCE" />
        <Input label="Department name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Department of Mathematical Sciences" />
        <Select label="Faculty assignment" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
          <option value="">No faculty (pending confirmation)</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="pending_confirmation">Pending confirmation</option>
          <option value="inactive">Inactive</option>
        </Select>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save department</Button>
        </div>
      </form>
    </Dialog>
  );
}

function ProgrammeFormModal({
  item,
  faculties,
  onClose,
  onSuccess,
}: {
  item: AdminProgramme | null;
  faculties: AdminFaculty[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [facultyId, setFacultyId] = useState(item?.faculty_id ? String(item.faculty_id) : '');
  const [award, setAward] = useState(item?.award ?? 'B.Sc.');
  const [studyLevel, setStudyLevel] = useState(item?.study_level ?? 'undergraduate');
  const [status, setStatus] = useState(item?.status ?? 'active');
  const [sourceNote, setSourceNote] = useState(item?.source_note ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      if (item) {
        await adminService.updateProgramme(item.id, {
          name: name.trim(),
          faculty_id: facultyId ? Number(facultyId) : null,
          award: award.trim() || null,
          study_level: studyLevel,
          status,
          source_note: sourceNote.trim() || null,
        });
      } else {
        await adminService.createProgramme({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          faculty_id: facultyId ? Number(facultyId) : null,
          award: award.trim() || null,
          study_level: studyLevel,
          status,
          source_note: sourceNote.trim() || null,
        });
      }
      onSuccess();
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : 'Unable to save programme.');
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title={item ? 'Edit Programme' : 'Add Programme'}>
      <form onSubmit={save} className="space-y-4">
        {err && <Alert tone="error">{err}</Alert>}
        <Input label="Programme code" value={code} onChange={(e) => setCode(e.target.value)} disabled={Boolean(item)} required placeholder="e.g. BSC-COMPUTER-SCIENCE" />
        <Input label="Programme title" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Computer Science" />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Award (Degree title)" value={award} onChange={(e) => setAward(e.target.value)} placeholder="e.g. B.Sc., LL.B., M.Sc." />
          <Select label="Study level" value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)}>
            <option value="undergraduate">Undergraduate</option>
            <option value="postgraduate">Postgraduate</option>
            <option value="doctoral">Doctoral</option>
          </Select>
        </div>
        <Select label="Parent faculty" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
          <option value="">Pending faculty assignment</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
        <Select label="Verification status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="approved_not_commenced">Approved (not yet commenced)</option>
          <option value="pending_confirmation">Pending confirmation</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Input label="Source / Verification Note" value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} placeholder="e.g. Approved 2026/2027 commencement" />
        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save programme</Button>
        </div>
      </form>
    </Dialog>
  );
}
