// components/data.ts
import type { LucideIcon } from "lucide-react";
import { Layers, Grid3X3, Boxes, DollarSign, ShieldCheck, FileText, RefreshCcw, Info } from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  group?: "module" | "billing" | "legal";
};

export const menuItems: MenuItem[] = [
  { label: "Core Frameworks", href: "/modules/core", icon: Layers, group: "module" },
  { label: "General Modules", href: "/modules/general", icon: Grid3X3, group: "module" },
  { label: "Industry Templates", href: "/modules/industry", icon: Boxes, group: "module" },

  { label: "Pricing", href: "/pricing", icon: DollarSign, group: "billing" },

  { label: "Privacy", href: "/privacy", icon: ShieldCheck, group: "legal" },
  { label: "Terms", href: "/terms", icon: FileText, group: "legal" },
  { label: "Refund", href: "/refund", icon: RefreshCcw, group: "legal" },
  { label: "About", href: "/about", icon: Info, group: "legal" },
];

// Sidebar 里的搜索一般会用这个做 quick search
export const searchIndex = menuItems.map((i) => ({
  title: i.label,
  href: i.href,
  keywords: [i.label.toLowerCase()],
}));
