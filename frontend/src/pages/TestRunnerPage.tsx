import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { ArrowLeft, ListChecks, Info } from 'lucide-react';

export function TestRunnerPage() {
  return (
    <div className="container-page py-12 max-w-2xl">
      <Card>
        <EmptyState
          icon={<ListChecks className="h-7 w-7" />}
          title="This practice test is unavailable"
          description="There are no published practice tests at this time."
          action={<Link to="/practice"><Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to practice tests</Button></Link>}
        />
      </Card>
      <Alert tone="info" className="mt-6">
        <div className="flex items-start gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" /><p className="text-sm">Practice questions, test attempts, and scoring are not yet available through the platform.</p></div>
      </Alert>
    </div>
  );
}
