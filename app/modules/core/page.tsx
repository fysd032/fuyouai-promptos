// app/modules/core/page.tsx
"use client";

import React, { Suspense } from "react";
import CoreFrameworkPage from "@/src/components/pages/CoreFrameworkPage";

export default function Page() {
  return (
    <Suspense>
      <CoreFrameworkPage />
    </Suspense>
  );
}
