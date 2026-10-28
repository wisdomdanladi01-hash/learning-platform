import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="container-page py-16 max-w-lg">
      <EmptyState
        icon={<Compass className="h-7 w-7" />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={<Link to="/"><Button>Back to home</Button></Link>}
      />
    </div>
  );
}
