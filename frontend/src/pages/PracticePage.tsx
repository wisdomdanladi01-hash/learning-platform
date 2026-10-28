import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { ListChecks, BookOpen, Info } from 'lucide-react';

export function PracticePage() {
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-950">Practice Tests</h1>
        <p className="mt-1.5 text-sm text-ink-600 max-w-2xl">
          Practice assessments will be available here when questions and test rules are managed by the learning platform.
        </p>
      </div>
      <Card>
        <EmptyState
          icon={<ListChecks className="h-7 w-7" />}
          title="No practice tests available"
          description="There are no published practice tests at this time."
          action={<Link to="/materials"><Button leftIcon={<BookOpen className="h-4 w-4" />}>Browse learning materials</Button></Link>}
        />
      </Card>
      <Alert tone="info" className="mt-6">
        <div className="flex items-start gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" /><p className="text-sm">Test questions, scoring, attempts, and results are not yet provided by the backend.</p></div>
      </Alert>
    </div>
  );
}
