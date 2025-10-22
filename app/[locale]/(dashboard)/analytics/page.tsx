import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | JobE',
  description: 'View analytics and reports',
};

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Analytics</h1>
      <p className="text-muted-foreground">
        View analytics and reports
      </p>
    </div>
  );
}
