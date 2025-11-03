import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import "@/lib/dev/patch-react-debug";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NhostProvider } from "@/components/providers/nhost-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { OrganizationProvider } from "@/lib/contexts/organization-context";
import { locales } from "@/lib/i18n";
import { DevPatches } from "@/components/utils/dev-patches";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobE - HR Management Platform",
  description: "Modern HR management platform for organizations",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  
  // Get messages for the current locale
  const messages = await getMessages({ locale: locale || "en" });

  // Get loading text for fallback
  const loadingText = messages?.common?.loadingEllipsis as string || "Loading…";

  return (
    <html lang={locale || "en"} suppressHydrationWarning>
      <body className={inter.className}>
        {/* Dev-only global patches (no-op in production) */}
        <DevPatches />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
            {loadingText}
          </div>
        }>
          {/* Intl provider must wrap the entire tree so client dialogs inside AuthProvider have context */}
          <NextIntlClientProvider messages={messages} locale={locale || "en"}>
            <QueryProvider>
              <NhostProvider>
                <AuthProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                    disableTransitionOnChange
                  >
                    <OrganizationProvider>
                      {children}
                    </OrganizationProvider>
                    <Toaster position="top-center" richColors />
                  </ThemeProvider>
                </AuthProvider>
              </NhostProvider>
            </QueryProvider>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}

// Pre-generate localized segments so [locale] is satisfied at build time
export async function generateStaticParams() {
  return (locales as readonly string[]).map((locale) => ({ locale }));
}
