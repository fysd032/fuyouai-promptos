"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { fetchRegistry } from "@/src/lib/registry";

type RegistryVariant = {
  variantId: string;
  label?: string;
  name?: string;
  description?: string;
};

type RegistryModule = {
  frontModuleId: string;
  frontModuleLabel?: string;
  variants?: RegistryVariant[];
};

export default function GeneralModuleDetailPage() {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>

      <div className="border border-[#1F2937] rounded-xl bg-[#111827] p-5">
        {loading ? (
          <div className="text-sm text-gray-400">Loading...</div>
        ) : moduleItem ? (
          <>
            <h2 className="text-xl font-bold text-white mb-2" translate="yes">
              {moduleItem.frontModuleLabel ?? moduleItem.frontModuleId}
            </h2>
            <div className="text-xs text-gray-500 mb-4">
              Module ID: {moduleItem.frontModuleId}
            </div>
            {variantId ? (
              <div className="text-xs text-emerald-400 mb-4">
                Selected: {variantId}
              </div>
            ) : null}

            <div className="space-y-2">
              {variants.length ? (
                variants.map((variant) => (
                  <button
                    key={variant.variantId}
                    type="button"
                    onClick={() => {
                      console.log("variant click", {
                        moduleId: moduleItem.frontModuleId,
                        variantId: variant.variantId,
                      });
                      router.push(
                        `/modules/general/${moduleItem.frontModuleId}/${variant.variantId}/run`
                      );
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      variantId === variant.variantId
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-[#1F2937] hover:bg-[#1F2937]"
                    }`}
                  >
                    <div translate="yes">
                      <div className="text-sm text-white font-medium">
                        {variant.label || variant.name || variant.variantId}
                      </div>
                      {variant.description ? (
                        <div className="text-xs text-gray-400 mt-1">
                          {variant.description}
                        </div>
                      ) : null}
                    </div>
                    <ChevronRight size={16} className="text-[#6B7280]" />
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-400" translate="yes">No variants found</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-400" translate="yes">Module not found</div>
        )}
      </div>
    </div>
  );
}

