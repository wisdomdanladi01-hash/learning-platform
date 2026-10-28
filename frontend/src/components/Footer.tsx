import { Link } from 'react-router-dom';
import { BrandMark } from '@/components/BrandMark';

const cols = [
  {
    title: 'Explore',
    links: [
      { to: '/materials', label: 'Learning Materials' },
      { to: '/courses', label: 'Course Catalogue' },
      { to: '/practice', label: 'Practice Tests' },
      { to: '/how-it-works', label: 'How It Works' },
      { to: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Log in' },
      { to: '/register', label: 'Create account' },
      { to: '/dashboard', label: 'Student dashboard' },
      { to: '/profile', label: 'Profile & settings' },
    ],
  },
  {
    title: 'About',
    links: [
      { to: '/about', label: 'About' },
      { to: '/help', label: 'Help' },
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Service' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-100 bg-white">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <BrandMark size="sm" />
            <p className="mt-4 max-w-sm text-sm text-ink-600 leading-relaxed">
              Discover learning materials organized around your academic journey at SAZU.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-ink-700 hover:text-teal-700 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="md:col-span-1" />
        </div>
        <div className="mt-10 pt-6 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-500">
            &copy; {new Date().getFullYear()} SAZU Study Hub. Independent learning resource platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
