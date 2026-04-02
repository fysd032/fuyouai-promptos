// app/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuyouAI",
  description:
    "FuyouAI transforms ambiguous requirements into stable, automated workflows.",
};

function detectLocale(acceptLanguage: string | null): "en" | "zh" {
  if (!acceptLanguage) return "en";
  // Check if Chinese is preferred
  const langs = acceptLanguage.toLowerCase();
  if (langs.startsWith("zh") || langs.includes(",zh")) return "zh";
  return "en";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const locale = detectLocale(acceptLanguage);
  const messages = (await import(`../messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
