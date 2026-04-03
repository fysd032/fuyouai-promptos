"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ModuleRunner } from "@/src/components/ModuleRunner";
import { fetchRegistry } from "@/src/lib/registry";

type RegistryVariant = {
  variantId: string;
  label?: string;
  name?: string;
  description?: string;
  backendModules?: Array<{
    promptKey?: string;
  }>;
};

type RegistryModule = {
  frontModuleId: string;
  frontModuleLabel?: string;
  variants?: RegistryVariant[];
};

export default function GeneralModuleRunPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Array.isArray(params?.moduleId)
    ? params.moduleId[0]
    : params?.moduleId;
  const variantId = Array.isArray(params?.variantId)
    ? params.variantId[0]
    : params?.variantId;
  const [modules, setModules] = useState<RegistryModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialInput, setInitialInput] = useState("");

  // 读取首页 Router 传来的预填文本，与手机端 MobileRun 完全相同的方式
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("mobile-run-state");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.text) setInitialInput(parsed.text);
    } catch {}
  }, []);

  useEffect(() => {
    let active = true;
    fetchRegistry()
      .then((r: { data?: RegistryModule[] }) => {
        if (!active) return;
        setModules(r.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setModules([]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const moduleItem = useMemo(
    () => modules.find((m) => m.frontModuleId === moduleId),
    [modules, moduleId]
  );
 const variants = moduleItem?.variants ?? [];
  const selectedVariant = variants.find((v) => v.variantId === variantId);
  const promptKey = selectedVariant?.backendModules?.[0]?.promptKey ?? "";
  if (loading) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  if (!moduleItem || !variantId || !selectedVariant) {
    return (
      <div className="text-sm text-gray-400">
        <span>Run parameters not found: </span>
        <span className="">
          {moduleId} / {variantId}
        </span>
      </div>
    );
  }

  if (!promptKey) {
    return (
      <div className="border border-[#1F2937] rounded-xl bg-[#111827] p-5">
        <div className="text-sm text-gray-400 mb-3">
          Missing promptKey, cannot run.
        </div>
        <div className="text-xs text-gray-500">
          moduleId: {moduleId} | variantId: {variantId}
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-medium border border-[#1F2937] text-white hover:bg-[#1F2937] transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <ModuleRunner
      moduleType="general"
      moduleKey={promptKey}
      moduleData={{
        title: moduleItem.frontModuleLabel ?? moduleItem.frontModuleId,
        desc: selectedVariant.label || selectedVariant.name || "",
        promptPreview: "",
        variant: selectedVariant,
      }}
      onBack={() => router.back()}
      initialInput={initialInput}
    />
  );
}

