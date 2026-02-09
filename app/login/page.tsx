// app/login/page.tsx
"use client";

import { Suspense } from "react";
import { Login } from "@/components/Login";

export default function Page() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
