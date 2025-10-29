import Header from '@/components/layout/header';
import { SkipToContent } from '@/components/layout/skip-to-content';

export default function NewOrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipToContent />
      <div className="min-h-screen flex flex-col bg-background">
        <Header showMenuButton={false} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
