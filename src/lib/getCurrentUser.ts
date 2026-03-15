/**
 * src/lib/getCurrentUser.ts
 *
 * 统一获取当前登录用户的工具函数（客户端使用）。
 * - 在 React 组件中推荐用 useSubscription().user / userId
 * - 在非组件的 lib / 工具函数中使用此文件
 */

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export interface CurrentUser {
  user: User;
  userId: string;
  accessToken: string;
}

/**
 * 获取当前已登录用户，未登录时返回 null。
 * 使用 getUser() 而非 getSession()，保证 token 经过服务端验证。
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session?.user) return null;

  return {
    user: session.user,
    userId: session.user.id,
    accessToken: session.access_token,
  };
}

/**
 * 同 getCurrentUser，但未登录时抛出错误。
 * 用于"必须登录才能执行"的操作。
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const result = await getCurrentUser();
  if (!result) throw new Error("User is not authenticated");
  return result;
}
