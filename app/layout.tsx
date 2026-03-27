// app/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import enMessages from "../messages/en.json";

export const metadata: Metadata = {
  title: "FuyouAI",
  description:
    "FuyouAI transforms ambiguous requirements into stable, automated workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider locale="en" messages={enMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
