import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { catalogService } from '@/services/catalog';
import { apiRequest } from '@/services/api';
import type { AcademicCatalogue } from '@/types';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { GraduationCap, ArrowRight, CheckCircle2, SkipForward } from 'lucide-react';

interface StudentAcademicData {
  academic_profile: {
    jamb_registration_number: string | null;
    matriculation_number: string | null;
    programme_id: number | null;
    department_id: number | null;
    admission_session_id: number | null;
    verified_level_id: number | null;
    verified_session_id: number | null;
  } | null;
}

export function OnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const [catalogue, setCatalogue] = useState<AcademicCatalogue | null>(null);
  const [programmeId, setProgrammeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      catalogService.getAcademicCatalogue(),
      apiRequest<StudentAcademicData>('/dashboard'),
    ]).then(([data, student]) => {
      if (!active) return;
      setCatalogue(data);
      setProgrammeId(student.academic_profile?.programme_id ? String(student.academic_profile.programme_id) : '');
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Unable to load your academic options.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const departments = useMemo(() => {
    const programme = catalogue?.programmes.find((item) => String(item.id) === programmeId);
    if (!catalogue) return [];
    return programme?.faculty_id
      ? catalogue.departments.filter((item) => item.faculty_id === programme.faculty_id)
      : catalogue.departments;
  }, [catalogue, programmeId]);

  const skip = () => navigate(redirect ? decodeURIComponent(redirect) : '/dashboard', { replace: true });

  const submit = async () => {
    if (!programmeId || !sessionId) {
      setError('Select your programme and admission session to submit your academic details.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const student = await apiRequest<StudentAcademicData>('/dashboard');
      await apiRequest('/verification/submissions', {
        method: 'POST',
        body: JSON.stringify({
          jamb_registration_number: student.academic_profile?.jamb_registration_number ?? undefined,
          matriculation_number: student.academic_profile?.matriculation_number ?? undefined,
          programme_id: Number(programmeId),
          department_id: departmentId ? Number(departmentId) : undefined,
          admission_session_id: Number(sessionId),
          claimed_level_id: levelId ? Number(levelId) : undefined,
        }),
      });
      await refreshProfile();
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit your academic details.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="container-page py-16 max-w-md">
        <Alert tone="error" title="Not signed in"><p className="text-sm">Please create an account or sign in to continue.</p></Alert>
        <div className="mt-4 flex gap-3"><Link to="/register"><Button>Create account</Button></Link><Link to="/login"><Button variant="outline">Sign in</Button></Link></div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-ink-50">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700"><CheckCircle2 className="h-7 w-7" /></div>
          <h1 className="font-display text-2xl font-bold text-ink-950">Details submitted</h1>
          <p className="mt-2 text-sm text-ink-600">Your academic information is awaiting review.</p>
          <Button className="mt-6" fullWidth onClick={skip} rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink-50 py-10 px-4">
      <div className="w-full max-w-xl mx-auto">
        <div className="text-center mb-6">
          <Badge tone="teal" className="mb-3"><GraduationCap className="h-3 w-3" /> Academic profile</Badge>
          <h1 className="font-display text-2xl font-bold text-ink-950">Tell us about your studies</h1>
          <p className="mt-1.5 text-sm text-ink-600">These details support student verification. You can skip and submit them later.</p>
        </div>
        <Card className="p-6 sm:p-8">
          {error && <Alert tone="error" className="mb-4">{error}</Alert>}
          {loading ? <p className="text-sm text-ink-600">Loading academic options…</p> : (
            <div className="space-y-4">
              <Select label="Programme" value={programmeId} onChange={(event) => { setProgrammeId(event.target.value); setDepartmentId(''); }}>
                <option value="">Select programme</option>
                {(catalogue?.programmes ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              <Select label="Department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} disabled={!programmeId}>
                <option value="">Select department (optional)</option>
                {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              <Select label="Admission session" value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
                <option value="">Select admission session</option>
                {(catalogue?.sessions ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              <Select label="Current level (optional)" value={levelId} onChange={(event) => setLevelId(event.target.value)}>
                <option value="">Select level</option>
                {(catalogue?.levels ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              {(!catalogue?.programmes.length || !catalogue.sessions.length) && (
                <Alert tone="info">Academic options have not been configured yet. You can skip now and complete this later.</Alert>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button fullWidth size="lg" onClick={submit} loading={saving} disabled={loading || !catalogue?.programmes.length || !catalogue.sessions.length} rightIcon={<ArrowRight className="h-4 w-4" />}>Submit for verification</Button>
            <Button fullWidth variant="ghost" leftIcon={<SkipForward className="h-4 w-4" />} onClick={skip}>Skip for now</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
