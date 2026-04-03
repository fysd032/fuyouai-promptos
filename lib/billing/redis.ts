import { Redis } from "@upstash/redis";

if (process.env.NODE_ENV !== "production") {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[redis] Upstash env not set, cache will be disabled");
  }
}

export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
