import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, FolderKanban, Briefcase, Upload, Network } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.orgStructure');
  return {
    title: `${t('title')} | JobE`,
    description: t('description'),
  };
}

interface PageProps {
  params: Promise<{
    locale: string;
    orgId: string;
  }>;
}

export default async function OrgStructurePage({ params }: PageProps) {
  const t = await getTranslations('pages.orgStructure');
  const { locale, orgId } = await params;
  
  // TODO: Fetch real data from backend
  const stats = {
    departments: 0,
    positions: 0,
    evaluations: 0,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              {t('stats.departments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.departments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stats.departmentsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {t('stats.positions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.positions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stats.positionsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Network className="h-4 w-4" />
              {t('stats.evaluated')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.evaluations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stats.evaluatedDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('quickActions.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Import from Excel */}
          <Card className="group cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50">
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/import`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t('quickActions.import.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('quickActions.import.description')}</CardDescription>
              </CardContent>
            </Link>
          </Card>

          {/* View Departments */}
          <Card className="group cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50">
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <FolderKanban className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{t('quickActions.departments.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('quickActions.departments.description')}</CardDescription>
              </CardContent>
            </Link>
          </Card>

          {/* View Positions */}
          <Card className="group cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50">
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/positions`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">{t('quickActions.positions.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('quickActions.positions.description')}</CardDescription>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      {/* Empty State for new orgs */}
      {stats.departments === 0 && stats.positions === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('emptyState.title')}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t('emptyState.description')}
                </p>
              </div>
              <div className="pt-4">
                <Button asChild size="lg">
                  <Link href={`/${locale}/dashboard/${orgId}/org-structure/import`}>
                    <Upload className="h-4 w-4 mr-2" />
                    {t('emptyState.action')}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
