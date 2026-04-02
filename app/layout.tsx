// app/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { headers, cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuyouAI",
  description:
    "FuyouAI transforms ambiguous requirements into stable, automated workflows.",
};

function detectLocaleFromHeader(acceptLanguage: string | null): "en" | "zh" {
  if (!acceptLanguage) return "en";
  const langs = acceptLanguage.toLowerCase();
  if (langs.startsWith("zh") || langs.includes(",zh")) return "zh";
  return "en";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Priority: cookie (user's explicit choice) > Accept-Language (browser default)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale: "en" | "zh";
  if (cookieLocale === "en" || cookieLocale === "zh") {
    locale = cookieLocale;
  } else {
    const headersList = await headers();
    locale = detectLocaleFromHeader(headersList.get("accept-language"));
  }

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
