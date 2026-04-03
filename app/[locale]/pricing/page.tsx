"use client";

import { Pricing } from "@/components/Pricing";
import { SubscriptionProvider } from "@/src/context/SubscriptionContext";

export default function Page() {
  return (
    <SubscriptionProvider>
      <Pricing />
    </SubscriptionProvider>
  );
}
