import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NhostProvider } from "@/components/providers/nhost-provider";
import { AuthProvider } from "@/lib/contexts/auth-context";
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
  const messages = await getMessages();

  return (
    <html lang={locale || "en"} suppressHydrationWarning>
      <body className={inter.className}>
        <NhostProvider>
          <AuthProvider>
            <NextIntlClientProvider messages={messages}>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange
              >
                {children}
                <Toaster position="top-right" richColors />
              </ThemeProvider>
            </NextIntlClientProvider>
          </AuthProvider>
        </NhostProvider>
      </body>
    </html>
  );
}
