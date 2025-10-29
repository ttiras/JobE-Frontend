"use client";

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CreateOrganizationForm } from '@/components/organizations/create-organization-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewOrganizationPage() {
  const t = useTranslations('pages.organizations');
  const router = useRouter();

  const handleCreated = (org: { id: string; name: string }) => {
    // Redirect to the newly created organization's dashboard
    router.push(`/dashboard/${org.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <Link href="/dashboard/organizations">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to organizations
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('create.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Create a new organization to manage positions, teams, and workflows.
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border rounded-lg p-6">
          <CreateOrganizationForm onCreated={handleCreated} />
        </div>
      </div>
    </div>
  );
}
