import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { AuthShell } from '@/components/AuthShell';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check, X, ShieldCheck, GraduationCap } from 'lucide-react';

interface PwRule { label: string; test: (pw: string) => boolean; }

const pwRules: PwRule[] = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [matriculationNumber, setMatriculationNumber] = useState('');
  const [jambRegistrationNumber, setJambRegistrationNumber] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwScore = useMemo(() => pwRules.filter((r) => r.test(password)).length, [password]);
  const confirmError = confirm.length > 0 && confirm !== password ? 'Passwords do not match.' : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !surname.trim()) return setError('Enter your first name and surname.');
    if (!matriculationNumber.trim() && !jambRegistrationNumber.trim()) {
      return setError('Enter a matric number or JAMB number to continue.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (pwScore < pwRules.length) return setError('Please choose a stronger password.');
    if (confirm !== password) return setError('Passwords do not match.');
    if (!agree) return setError('Please review and accept the terms to continue.');
    setLoading(true);
    const result = await register({
      firstName,
      middleName,
      surname,
      email,
      password,
      matriculationNumber,
      jambRegistrationNumber,
    });
    setLoading(false);
    if (result.ok) {
      navigate(redirect ? `/onboarding?redirect=${encodeURIComponent(redirect)}` : '/onboarding', { replace: true });
    } else {
      setError(result.error ?? 'Unable to create account.');
    }
  };

  return (
    <AuthShell>
        <Card className="border-0 shadow-none sm:border sm:border-ink-100 sm:shadow-card">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-teal-700 mb-5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-950">Create your account</h1>
          <p className="mt-1.5 text-sm text-ink-600">It's free to browse. Add a subscription later to unlock full materials.</p>

          {error && <Alert tone="error" className="mt-5"><p className="text-sm">{error}</p></Alert>}

          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            <Input label="First name" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Aisha" leftIcon={<User className="h-4 w-4" />} />
            <Input label="Middle name (optional)" autoComplete="additional-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Optional" />
            <Input label="Surname" autoComplete="family-name" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Musa" />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Matric number" autoComplete="off" value={matriculationNumber} onChange={(e) => setMatriculationNumber(e.target.value)} placeholder="If available" leftIcon={<GraduationCap className="h-4 w-4" />} />
              <Input label="JAMB number (if no matric number)" autoComplete="off" value={jambRegistrationNumber} onChange={(e) => setJambRegistrationNumber(e.target.value)} placeholder="JAMB registration number" />
            </div>
            <p className="-mt-2 text-xs text-ink-500">Provide at least one student identifier. Matric number is preferred if you have one.</p>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightSlot={
                <button type="button" onClick={() => setShowPw((v) => !v)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100" aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {password.length > 0 && (
              <ul className="space-y-1">
                {pwRules.map((r) => {
                  const ok = r.test(password);
                  return (
                    <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-700' : 'text-ink-500'}`}>
                      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
            <Input
              label="Confirm password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={confirmError}
            />
            <label className="flex items-start gap-2.5 text-sm text-ink-700 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-ink-300 text-teal-600 focus:ring-teal-500" />
              <span>I agree to the <Link to="/terms" className="font-semibold text-teal-700 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="font-semibold text-teal-700 hover:underline">Privacy Policy</Link>.</span>
            </label>
            <Button type="submit" fullWidth size="lg" loading={loading}>Create account</Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            Already have an account?{' '}
            <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="font-semibold text-teal-700 hover:text-teal-800">Sign in</Link>
          </p>
        </Card>
        <p className="mt-4 text-center text-xs text-ink-500 inline-flex items-center gap-1.5 w-full justify-center">
          <ShieldCheck className="h-3.5 w-3.5" /> Your password is securely handled by the Study Hub service.
        </p>
    </AuthShell>
  );
}
