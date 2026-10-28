import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { AuthShell } from '@/components/AuthShell';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.ok) {
      navigate(redirect ? decodeURIComponent(redirect) : '/dashboard', { replace: true });
    } else {
      setError(result.error ?? 'Unable to sign in.');
    }
  };

  return (
    <AuthShell>
        <Card className="border-0 shadow-none sm:border sm:border-ink-100 sm:shadow-card">
          <Link to={redirect ? decodeURIComponent(redirect) : '/'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-teal-700 mb-5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-950">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-600">Sign in to continue to your study dashboard.</p>

          {error && <Alert tone="error" className="mt-5"><p className="text-sm">{error}</p></Alert>}

          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500 inline-flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> Password recovery is not available yet.</span>
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading}>Sign in</Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            Don't have an account?{' '}
            <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} className="font-semibold text-teal-700 hover:text-teal-800">
              Create one
            </Link>
          </p>
        </Card>
    </AuthShell>
  );
}
