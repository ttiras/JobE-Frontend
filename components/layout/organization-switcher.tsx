"use client";

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Check, 
  Search,
  AlertCircle,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/lib/contexts/organization-context';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuery } from '@/lib/hooks/use-graphql';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Organization = {
  id: string;
  name: string;
  is_active?: boolean | null;
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
      is_active
    }
  }
`;

export function OrganizationSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('header');
  
  const { user, isAuthenticated } = useAuth();
  const { currentOrganization, switchOrganization } = useOrganization();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userId = user?.id;
  const { data, loading, error } = useQuery<OrgsResult>(
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
      org.name.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  const handleOrganizationSwitch = (org: Organization) => {
    try {
      switchOrganization({ id: org.id, name: org.name });
      setIsDropdownOpen(false);
      setSearchQuery('');
      
      // Navigate to organization dashboard
      // Check if we're already in /dashboard (no locale prefix)
      const isDirectDashboard = pathname?.startsWith('/dashboard');
      const locale = isDirectDashboard ? '' : (pathname?.split('/')[1] || 'en');
      const basePath = isDirectDashboard ? '' : `/${locale}`;
      
      router.push(`${basePath}/dashboard/${org.id}`);
      toast.success(t('switchOrganization') + `: ${org.name}`);
    } catch (err) {
      toast.error(t('noOrganizations'));
      console.error('Organization switch error:', err);
    }
  };

  const handleAllOrganizations = () => {
    setIsDropdownOpen(false);
    
    // Check if we're already in /dashboard (no locale prefix)
    const isDirectDashboard = pathname?.startsWith('/dashboard');
    const locale = isDirectDashboard ? '' : (pathname?.split('/')[1] || 'en');
    const basePath = isDirectDashboard ? '' : `/${locale}`;
    
    router.push(`${basePath}/dashboard/organizations`);
  };

  const handleNewOrganization = () => {
    setIsDropdownOpen(false);
    
    // Check if we're already in /dashboard (no locale prefix)
    const isDirectDashboard = pathname?.startsWith('/dashboard');
    const locale = isDirectDashboard ? '' : (pathname?.split('/')[1] || 'en');
    const basePath = isDirectDashboard ? '' : `/${locale}`;
    
    router.push(`${basePath}/dashboard/new`);
  };

  // Don't render if not authenticated
  if (!isAuthenticated) return null;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 animate-pulse">
        <div className="w-6 h-6 rounded-md bg-primary/10" />
        <div className="w-24 h-4 bg-primary/10 rounded" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>{t('noOrganizations')}</span>
      </div>
    );
  }

  // No organizations - show create button
  if (organizations.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleNewOrganization}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t('createOrganization')}</span>
      </Button>
    );
  }

  // Single organization - show as clickable (can click to see all orgs)
  if (organizations.length === 1 && currentOrganization) {
    return (
      <Button
        variant="ghost"
        className="flex items-center gap-2 px-3 py-1.5 h-auto rounded-lg hover:bg-accent"
        onClick={handleAllOrganizations}
      >
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium">{currentOrganization.name}</span>
        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground ml-1" />
      </Button>
    );
  }

  // Multiple organizations - show dropdown
  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 py-1.5 h-auto rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {currentOrganization?.name || t('selectOrganization')}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[280px] p-2">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 pb-2">
            {t('yourOrganizations')}
          </DropdownMenuLabel>

          {/* Search - show if more than 5 organizations */}
          {organizations.length > 5 && (
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchOrganizations')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
          )}

          {/* Organization List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOrganizations.length > 0 ? (
              filteredOrganizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrganizationSwitch(org)}
                  className={cn(
                    "flex items-center justify-between px-2 py-2 cursor-pointer rounded-md",
                    currentOrganization?.id === org.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm truncate">{org.name}</span>
                  </div>
                  {currentOrganization?.id === org.id && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                {t('noOrganizations')}
              </div>
            )}
          </div>

          <DropdownMenuSeparator className="my-2" />

          {/* All Organizations */}
          <DropdownMenuItem
            onClick={handleAllOrganizations}
            className="flex items-center gap-2 px-2 py-2 cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-sm font-medium">{t('yourOrganizations')}</span>
          </DropdownMenuItem>

          {/* Create New Organization */}
          <DropdownMenuItem
            onClick={handleNewOrganization}
            className="flex items-center gap-2 px-2 py-2 cursor-pointer text-primary"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">{t('newOrganization')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
