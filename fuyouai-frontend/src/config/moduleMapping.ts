import mappingJson from "./module_mapping.v2.json";

export interface BackendModule {
  moduleId: string;
  promptKey: string;
  weight: number;
}

export interface Variant {
  variantId: string;
  label: string;
  description: string;
  backendModules: BackendModule[];
}

export interface FrontModule {
  frontModuleId: string;
  frontModuleLabel: string;
  group?: string;
  variants: Variant[];
}

export const moduleMapping = mappingJson as FrontModule[];

// ===== 工具函数层 =====

export function getFrontModules(): FrontModule[] {
  return moduleMapping;
}

export function getFrontModule(frontModuleId: string): FrontModule | undefined {
  return moduleMapping.find(m => m.frontModuleId === frontModuleId);
}

export function getVariants(frontModuleId: string): Variant[] {
  return getFrontModule(frontModuleId)?.variants ?? [];
}

export function getVariant(
  frontModuleId: string,
  variantId: string
): Variant | undefined {
  return getVariants(frontModuleId).find(v => v.variantId === variantId);
}

export function getBackendModules(
  frontModuleId: string,
  variantId: string
): BackendModule[] {
  return getVariant(frontModuleId, variantId)?.backendModules ?? [];
}

// 可选：给每个模块定义一个默认 variant（不传时用第一个）
export function getDefaultVariantId(frontModuleId: string): string | undefined {
  const variants = getVariants(frontModuleId);
  return variants[0]?.variantId;
}
