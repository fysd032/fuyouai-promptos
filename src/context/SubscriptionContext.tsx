// src/context/SubscriptionContext.tsx
// 全局订阅状态管理

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// 订阅信息类型
export interface Subscription {
  plan: "basic" | "pro" | "free";
  status: "active" | "canceling" | "inactive";
  cancel_at_period_end?: boolean;
  current_period_end?: string | null;
  trialEnd?: string | null;
  creem_customer_id?: string | null;
  creem_subscription_id?: string | null;
  updated_at?: string | null;
}

interface SubscriptionContextValue {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  user: User | null;
  userId: string | null;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);
const normalizePlan = (plan?: string | null) => (plan === "starter" ? "basic" : plan);
const normalizeSubscription = (subscription: Subscription | null) => {
  if (!subscription) return subscription;
  return { ...subscription, plan: normalizePlan(subscription.plan) as Subscription["plan"] };
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // 未登录时不请求
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      // token 存在 => 已登录
      setIsAuthenticated(true);
      setUser(sessionData.session?.user ?? null);

      const apiUrl = API_BASE ? `${API_BASE}/api/subscription` : "/api/subscription";
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setSubscription(null);
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Debug: 打印 user.id 和返回的 debug 信息
      const user = sessionData.session?.user;
      console.log("[SubCtx] user.id =", user?.id);
      console.log("[SubCtx] response =", { ok: data.ok, subscription: data.subscription, debug: data.debug });

      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to fetch subscription");
        setSubscription(null);
        setLoading(false);
        return;
      }

      // subscription 可能为 null（无订阅记录）
      if (!data.subscription) {
        // No paid subscription — check if user has invite code access
        try {
          const inviteUrl = API_BASE ? `${API_BASE}/api/invite/status` : "/api/invite/status";
          const inviteRes = await fetch(inviteUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (inviteRes.ok) {
            const inviteData = await inviteRes.json();
            if (inviteData.verified && !inviteData.expired) {
              // Synthesize a basic subscription so RequirePlan passes
              setSubscription({
                plan: "basic",
                status: "active",
                cancel_at_period_end: false,
                current_period_end: null,
                trialEnd: null,
                creem_customer_id: null,
                creem_subscription_id: null,
                updated_at: null,
              });
              setLoading(false);
              return;
            }
          }
        } catch {
          // invite status check is best-effort; fall through to null subscription
        }
      }
      setSubscription(normalizeSubscription(data.subscription));
      setLoading(false);
    } catch (e: any) {
      console.error("[SubscriptionContext] fetch error:", e);
      setError(e?.message || "Network error");
      setSubscription(null);
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // 监听登录状态变化
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        fetchSubscription();
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setSubscription(null);
        setLoading(false);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [fetchSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        isAuthenticated,
        user,
        userId: user?.id ?? null,
        refreshSubscription: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook
export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

// 便捷方法：判断是否有有效订阅
export function isActivePlan(subscription: Subscription | null, plan: "basic" | "pro"): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active" && subscription.status !== "canceling") return false;
  const normalizedPlan = normalizePlan(subscription.plan) as Subscription["plan"];
  if (plan === "basic") return normalizedPlan === "basic" || normalizedPlan === "pro";
  if (plan === "pro") return subscription.plan === "pro";
  return false;
}

export function formatExpiryDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}
