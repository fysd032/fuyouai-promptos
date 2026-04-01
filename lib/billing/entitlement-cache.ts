import { redis } from "./redis";

export type Entitlement = {
  allowed: boolean;
  code?: "SUBSCRIPTION_REQUIRED" | "SUBSCRIPTION_EXPIRED";
  tier?: "paid" | "trial";
};

const PREFIX = "entitlement:";
const MAX_TTL = 600; // 10 minutes — prevents stale cache blocking subscription changes
const DEFAULT_TTL = Math.min(Number(process.env.ENTITLEMENT_TTL_SECONDS) || 120, MAX_TTL);

export async function getEntitlement(userId: string): Promise<Entitlement | null> {
  try {
    const raw = await redis.get<Entitlement>(`${PREFIX}${userId}`);
    return raw ?? null;
  } catch (e) {
    console.warn("[entitlement_cache] redis get failed, fallback to DB");
    return null;
  }
}

export async function setEntitlement(
  userId: string,
  payload: Entitlement,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  const safeTtl = Math.min(Math.max(ttl, 1), MAX_TTL);
  try {
    await redis.set(`${PREFIX}${userId}`, payload, { ex: safeTtl });
  } catch (e) {
    console.warn("[entitlement_cache] redis set failed, ignore");
  }
}

export async function bustEntitlement(userId: string): Promise<void> {
  try {
    await redis.del(`${PREFIX}${userId}`);
  } catch (e) {
    console.warn("[entitlement_cache] redis del failed, ignore");
  }
}
