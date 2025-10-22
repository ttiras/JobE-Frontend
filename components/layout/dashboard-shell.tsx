"use client";

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './sidebar';
import Header from './header';
import { SkipToContent } from './skip-to-content';
import { getSidebarCollapsed, setSidebarCollapsed } from '@/lib/utils/storage';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize sidebar collapsed state from localStorage
  useEffect(() => {
    const collapsed = getSidebarCollapsed();
    setIsSidebarCollapsed(collapsed);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sidebar collapse toggle
  const toggleSidebarCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    setSidebarCollapsed(newState);
  };

  // Handle mobile menu
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle mobile menu close - return focus to menu button
  const handleMobileMenuOpenChange = (open: boolean) => {
    setIsMobileMenuOpen(open);
    
    // Return focus to menu button when Sheet closes
    if (!open && menuButtonRef.current) {
      setTimeout(() => {
        menuButtonRef.current?.focus();
      }, 100);
    }
  };

  return (
    <>
      {/* Skip to Content Link for Keyboard Users */}
      <SkipToContent />
      
      <div className="min-h-screen flex">
        {/* Desktop/Tablet Sidebar */}
        {!isMobile && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            isMobile={false}
            onToggleCollapse={toggleSidebarCollapse}
          />
        )}

        {/* Mobile Sidebar (Sheet) */}
        {isMobile && (
          <Sidebar
            isMobile={true}
            isOpen={isMobileMenuOpen}
            onOpenChange={handleMobileMenuOpenChange}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onMenuClick={handleMobileMenuToggle}
            showMenuButton={isMobile}
            menuButtonRef={menuButtonRef}
          />
          <main id="main-content" className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
