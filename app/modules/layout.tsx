// app/modules/layout.tsx
"use client";

import ModuleShell from "@/components/ModuleShell";
import { SubscriptionProvider } from "@/src/context/SubscriptionContext";

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <ModuleShell>{children}</ModuleShell>
    </SubscriptionProvider>
  );
}
