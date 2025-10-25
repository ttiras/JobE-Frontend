import { Metadata } from 'next';
import { CreateOrganizationForm } from '@/components/organizations/create-organization-form'

export const metadata: Metadata = {
  title: 'Organizations | JobE',
  description: 'Manage organizations',
};

export default function OrganizationsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Organizations</h1>
        <p className="text-muted-foreground">Manage your organizations here</p>
      </div>

      <CreateOrganizationForm />
    </div>
  );
}
