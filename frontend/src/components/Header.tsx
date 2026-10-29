import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/auth/AuthContext';
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  BookOpen,
  ListChecks,
  Info,
  Tag,
  GraduationCap,
  Shield,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/materials', label: 'Learning Materials' },
  { to: '/courses', label: 'Courses' },
  { to: '/practice', label: 'Practice Tests' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/pricing', label: 'Pricing' },
];

export function Header() {
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const handleSignOut = () => {
    signOut();
    close();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-ink-100">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          <BrandMark />

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive ? 'text-teal-700 bg-teal-50' : 'text-ink-700 hover:text-ink-950 hover:bg-ink-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold"
                      leftIcon={<Shield className="h-4 w-4 text-teal-600" />}
                    >
                      Admin Portal
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} leftIcon={<LogOut className="h-4 w-4" />}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" leftIcon={<LogIn className="h-4 w-4" />}>
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
                    Create account
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-ink-100 bg-white animate-fade-in">
          <div className="container-page py-4 space-y-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={close}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold ${
                    isActive ? 'text-teal-700 bg-teal-50' : 'text-ink-800 hover:bg-ink-50'
                  }`
                }
              >
                <NavIcon to={item.to} />
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 mt-2 border-t border-ink-100 space-y-2">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" onClick={close}>
                      <Button
                        fullWidth
                        variant="outline"
                        className="border-teal-600 text-teal-700 hover:bg-teal-50"
                        leftIcon={<Shield className="h-4 w-4" />}
                      >
                        Admin Portal
                      </Button>
                    </Link>
                  )}
                  <Link to="/dashboard" onClick={close}>
                    <Button fullWidth variant="outline" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                      Dashboard
                    </Button>
                  </Link>
                  <Button fullWidth variant="ghost" onClick={handleSignOut} leftIcon={<LogOut className="h-4 w-4" />}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={close}>
                    <Button fullWidth variant="outline" leftIcon={<LogIn className="h-4 w-4" />}>
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" onClick={close}>
                    <Button fullWidth leftIcon={<UserPlus className="h-4 w-4" />}>
                      Create account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavIcon({ to }: { to: string }) {
  const cls = 'h-4 w-4 text-ink-400';
  if (to === '/') return <BookOpen className={cls} />;
  if (to === '/materials') return <BookOpen className={cls} />;
  if (to === '/courses') return <GraduationCap className={cls} />;
  if (to === '/practice') return <ListChecks className={cls} />;
  if (to === '/how-it-works') return <Info className={cls} />;
  if (to === '/pricing') return <Tag className={cls} />;
  return <BookOpen className={cls} />;
}
