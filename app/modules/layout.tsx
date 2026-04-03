// app/modules/layout.tsx
"use client";

import ModuleShell from "@/components/ModuleShell";
import { SubscriptionProvider } from "@/src/context/SubscriptionContext";
import { InviteGate } from "@/src/components/InviteGate";

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <ModuleShell>
        <InviteGate>{children}</InviteGate>
      </ModuleShell>
    </SubscriptionProvider>
  );
}
