"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization } from '@/lib/types/organization';
import { getStoredOrganization, setStoredOrganization } from '@/lib/utils/storage';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  switchOrganization: (org: Organization) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted organization on mount
  useEffect(() => {
    const stored = getStoredOrganization();
    if (stored) {
      setCurrentOrganization(stored);
    }
    setIsLoading(false);
  }, []);

  const switchOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    setStoredOrganization(org);
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        switchOrganization,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
