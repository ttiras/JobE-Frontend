"use client";

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuery } from '@/lib/hooks/use-graphql';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, ArrowRight, Users, MapPin, Coins, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Organization = {
  id: string;
  name: string;
  industry?: string | null;
  country?: string | null;
  size?: string | null;
  is_active?: boolean | null;
  currency?: string | null;
  created_at?: string;
  updated_at?: string;
};

type OrgsResult = {
  organizations: Organization[];
};

const GET_USER_ORGS = `
  query GetUserOrgs($userId: uuid!) {
    organizations(
      where: { created_by: { _eq: $userId }, deleted_at: { _is_null: true } }
      order_by: { created_at: desc }
    ) {
      id
      name
      industry
      country
      size
      is_active
      currency
      created_at
      updated_at
    }
  }
`;

export default function OrganizationsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const userId = user?.id;
  const { data, loading } = useQuery<OrgsResult>(
    GET_USER_ORGS,
    { userId },
    { skip: !isAuthenticated || !userId }
  );

  const organizations = useMemo(() => data?.organizations || [], [data]);

  // Filter organizations based on search
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const query = searchQuery.toLowerCase();
    return organizations.filter((org) =>
      org.name.toLowerCase().includes(query) ||
      org.industry?.toLowerCase().includes(query) ||
      org.country?.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  const handleOrgClick = useCallback((orgId: string) => {
    // Navigate to org-specific dashboard
    router.push(`/dashboard/${orgId}`);
  }, [router]);

  const handleNewOrg = useCallback(() => {
    router.push('/dashboard/new');
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-64 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Organizations</h1>
              <p className="text-muted-foreground mt-1">
                Manage and switch between your organizations
              </p>
            </div>
            <Button onClick={handleNewOrg} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New organization
            </Button>
          </div>

          {/* Search */}
          {organizations.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for an organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

        {/* Organizations Grid */}
        {filteredOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrganizations.map((org) => (
              <Card
                key={org.id}
                className="hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => handleOrgClick(org.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg truncate">{org.name}</CardTitle>
                        {org.is_active !== false ? (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3 space-y-2">
                  {org.industry && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span className="truncate">{org.industry}</span>
                    </div>
                  )}
                  {org.country && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{org.country}</span>
                    </div>
                  )}
                  {org.size && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span className="truncate">{org.size}</span>
                    </div>
                  )}
                  {org.currency && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Coins className="h-3.5 w-3.5" />
                      <span className="truncate">{org.currency}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full group-hover:bg-accent transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrgClick(org.id);
                    }}
                  >
                    Open dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : organizations.length === 0 ? (
          /* Empty State - No Organizations */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No organizations yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Get started by creating your first organization. You&apos;ll be able to manage positions,
                teams, and workflows.
              </p>
              <Button onClick={handleNewOrg} size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Create your first organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* No Search Results */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No organizations found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                No organizations match your search. Try different keywords.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
