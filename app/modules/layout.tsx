// app/modules/layout.tsx
import ModuleShell from "@/components/ModuleShell";

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell>{children}</ModuleShell>;
}
