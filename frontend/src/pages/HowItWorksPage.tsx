import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ShieldCheck, CreditCard, ListChecks, ArrowRight, Info } from 'lucide-react';

const steps = [
  { icon: Search, title: 'Find your course', text: 'Browse the courses and learning materials currently available on the platform.' },
  { icon: BookOpen, title: 'Explore materials', text: 'Review resource descriptions and file details before requesting a download.' },
  { icon: ShieldCheck, title: 'Create an account', text: 'Register and submit your academic details when verification is required.' },
  { icon: CreditCard, title: 'View packages', text: 'Review available subscription packages and their prices before checkout.' },
  { icon: ListChecks, title: 'Study and practise', text: 'Download materials you are authorized to access. Practice tests will appear when published.' },
];

export function HowItWorksPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl mx-auto text-center">
        <Badge tone="teal" className="mb-3">How it works</Badge>
        <h1 className="font-display text-3xl font-bold text-ink-950 text-balance">Find your course materials. Understand what you're studying. Prepare with confidence.</h1>
        <p className="mt-3 text-ink-600">Discover available resources, manage your account, and access materials based on their requirements.</p>
      </div>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 max-w-5xl mx-auto">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Card className="h-full p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">{i + 1}</div>
                <s.icon className="h-5 w-5 text-ink-400" />
              </div>
              <h3 className="font-display font-bold text-ink-950">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-600">{s.text}</p>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="mt-10 p-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-display font-bold text-ink-950">Access model, simply</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
              <li>· Public course and resource listings can be browsed without signing in.</li>
              <li>· Resource downloads are checked by the backend against your account and access entitlements.</li>
              <li>· Practice tests are not currently available through the platform.</li>
            </ul>
          </div>
        </div>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Link to="/materials"><Button leftIcon={<BookOpen className="h-4 w-4" />} rightIcon={<ArrowRight className="h-4 w-4" />}>Explore materials</Button></Link>
          <Link to="/pricing"><Button variant="outline">View pricing</Button></Link>
        </div>
      </Card>
    </div>
  );
}
