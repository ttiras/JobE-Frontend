"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization } from '@/lib/types/organization';
import { getStoredOrganization, setStoredOrganization } from '@/lib/utils/storage';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  switchOrganization: (org: Organization) => void;
  addOrganization: (org: Organization) => void;
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
    // Defer setState to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      if (stored) {
        setCurrentOrganization(stored);
      }
      setIsLoading(false);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const switchOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    setStoredOrganization(org);
  };

  const addOrganization = (org: Organization) => {
    setOrganizations(prev => {
      // Avoid duplicates by id if already present
      if (prev.some(o => o.id === org.id)) return prev;
      return [...prev, org];
    })
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        switchOrganization,
        addOrganization,
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
