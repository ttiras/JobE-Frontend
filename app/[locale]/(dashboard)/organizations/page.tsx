import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organizations | JobE',
  description: 'Manage organizations',
};

export default function OrganizationsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Organizations</h1>
      <p className="text-muted-foreground">
        Manage your organizations here
      </p>
    </div>
  );
}
