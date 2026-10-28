import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Dialog } from '@/components/ui/Dialog';
import { User, GraduationCap, Settings, CreditCard, LogOut, Check, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatDate } from '@/utils/format';

export function ProfilePage() {
  const { profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.fullName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (!profile) {
    return (
      <div className="container-page py-16 max-w-md">
        <Alert tone="info" title="Sign in to view your profile"><p className="text-sm">Profile and settings are available after you sign in.</p></Alert>
        <div className="mt-4"><Link to="/login"><Button>Sign in</Button></Link></div>
      </div>
    );
  }

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile({ fullName: name.trim(), email: email.trim() });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save account changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page py-8 sm:py-10 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-950">Profile &amp; settings</h1>
        <p className="mt-1.5 text-sm text-ink-600">Manage the account information associated with your Study Hub account.</p>
      </div>

      {saved && <Alert tone="success" className="mb-5"><p className="text-sm inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Account changes saved.</p></Alert>}
      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <Card className="p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-2 mb-4"><User className="h-5 w-5 text-teal-600" /><h2 className="font-display font-bold text-ink-950">Account information</h2></div>
        <form onSubmit={saveAccount} className="space-y-4">
          <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} leftIcon={<User className="h-4 w-4" />} required minLength={2} />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} leftIcon={<Mail className="h-4 w-4" />} required />
          <Button type="submit" loading={saving} leftIcon={<Check className="h-4 w-4" />}>Save changes</Button>
        </form>
      </Card>

      <Card className="p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-2 mb-3"><GraduationCap className="h-5 w-5 text-teal-600" /><h2 className="font-display font-bold text-ink-950">Academic profile &amp; verification</h2></div>
        <p className="text-sm text-ink-600">Academic details are submitted to the student verification process and reviewed by an administrator.</p>
        <Link to="/onboarding"><Button className="mt-4" variant="outline">Submit or update academic details</Button></Link>
      </Card>

      <Card className="p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-2 mb-4"><CreditCard className="h-5 w-5 text-teal-600" /><h2 className="font-display font-bold text-ink-950">Subscription</h2></div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-700">{profile.hasSubscription ? 'Your semester subscription is active.' : 'No active subscription.'}</p>
            {profile.subscriptionExpiresAt && <p className="mt-1 text-xs text-ink-500">Active until {formatDate(profile.subscriptionExpiresAt)}</p>}
          </div>
          <Badge tone={profile.hasSubscription ? 'green' : 'amber'}>{profile.hasSubscription ? 'Active' : 'Inactive'}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {!profile.hasSubscription && <Link to="/pricing"><Button size="sm" leftIcon={<CreditCard className="h-4 w-4" />}>View packages</Button></Link>}
          <Link to="/payments"><Button size="sm" variant="ghost">Payment history</Button></Link>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4"><Settings className="h-5 w-5 text-teal-600" /><h2 className="font-display font-bold text-ink-950">Account settings</h2></div>
        <div className="space-y-2">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"><span>Go to dashboard</span><ArrowRight className="h-4 w-4 text-ink-400" /></button>
          <button onClick={() => setLogoutOpen(true)} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" /> Sign out</span></button>
        </div>
      </Card>

      <p className="mt-5 text-xs text-ink-400 inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Account access is protected by the Study Hub API.</p>

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Sign out?"
        size="sm"
        footer={<div className="flex gap-2"><Button variant="outline" fullWidth onClick={() => setLogoutOpen(false)}>Cancel</Button><Button fullWidth variant="danger" onClick={() => { signOut(); setLogoutOpen(false); navigate('/'); }}>Sign out</Button></div>}
      >
        <p className="text-sm text-ink-600">You can sign back in any time.</p>
      </Dialog>
    </div>
  );
}
