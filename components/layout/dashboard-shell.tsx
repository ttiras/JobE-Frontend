"use client";

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './sidebar';
import Header from './header';
import { SkipToContent } from './skip-to-content';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header - Full width across top */}
        <Header
          onMenuClick={handleMobileMenuToggle}
          showMenuButton={isMobile}
          menuButtonRef={menuButtonRef}
        />

        {/* Content area with sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop/Tablet Sidebar - Fixed position below header, overlays content when expanded */}
          {!isMobile && (
            <Sidebar
              isMobile={false}
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

          {/* Main content with left padding to account for sidebar */}
          <main id="main-content" className="flex-1 overflow-auto custom-scrollbar md:pl-16">
            <div className="container mx-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
