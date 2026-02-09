"use client";

import { Subscription } from "@/components/AccountPages";
import { SubscriptionProvider } from "@/src/context/SubscriptionContext";

export default function Page() {
  return (
    <SubscriptionProvider>
      <Subscription />
    </SubscriptionProvider>
  );
}
