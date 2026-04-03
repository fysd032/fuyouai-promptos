import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }

  // Persist locale choice in cookie so /modules (root layout) can read it
  const cookieStore = await cookies();
  const currentCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (currentCookie !== locale) {
    cookieStore.set("NEXT_LOCALE", locale, { path: "/", maxAge: 365 * 24 * 60 * 60 });
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
