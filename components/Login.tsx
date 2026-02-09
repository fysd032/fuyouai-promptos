"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../src/lib/supabaseClient";

export const Login: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ 登录成功后跳转目标：优先用 ?from=xxx，其次 ?redirect=xxx，否则默认去 /modules/core
  const redirectTo = useMemo(() => {
    const from = searchParams?.get("from") ?? null;
    const redirect = searchParams?.get("redirect") ?? null;
    const target = from || redirect;
    return target && target.startsWith("/") ? target : "/modules/core";
  }, [searchParams]);

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // --- 工具：从 URL query 或 hash query 读取参数（兼容你之前的 #/login 模式）
  const getParam = (name: string) => {
    const url = new URL(window.location.href);
    const queryParams = new URLSearchParams(url.search);

    const hash = url.hash || "";
    const hashQuery = hash.includes("?") ? hash.split("?")[1] : "";
    const hashParams = new URLSearchParams(hashQuery);

    return hashParams.get(name) || queryParams.get(name);
  };

  // --- 工具：清理 URL（去掉 code/token 等敏感参数）
  const cleanUrl = () => {
    // 迁移到 Next 后，login 页标准路径是 /login
    const base = `${window.location.origin}/login`;
    window.history.replaceState({}, "", base);
  };

  // ✅ 首次进入：处理 OAuth / token 回调 + 已登录自动跳转
  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const code = getParam("code");
        const accessToken = getParam("access_token");
        const refreshToken = getParam("refresh_token");

        // 1) OAuth code 模式
        if (code) {
          const exchangeUrl = new URL(window.location.href);
          // Supabase 要求 code 在 search 中；同时清掉 hash
          exchangeUrl.hash = "";
          exchangeUrl.search = `?code=${encodeURIComponent(code)}`;

          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(exchangeUrl.toString());

          if (!active) return;

          if (exchangeError) {
            setError(exchangeError.message);
            cleanUrl();
            return;
          }

          if (data.session) {
            cleanUrl();
            router.replace(redirectTo);
            return;
          }
        }

        // 2) access_token/refresh_token 模式（兼容旧流程）
        if (accessToken && refreshToken) {
          const { data, error: setSessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (!active) return;

          if (setSessionError) {
            setError(setSessionError.message);
            cleanUrl();
            return;
          }

          if (data.session) {
            cleanUrl();
            router.replace(redirectTo);
            return;
          }
        }

        // 3) 已有 session：直接跳走
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        if (data.session) {
          router.replace(redirectTo);
        }
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Unknown error");
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [router, redirectTo]);

  // resend 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendCode = async () => {
    if (!email) return;

    setIsLoading(true);
    setError(null);

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // ✅ Next 标准：/login（不要再用 /#/login）
        emailRedirectTo: `${window.location.origin}/login?from=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });

    if (sendError) {
      setError(sendError.message);
      setIsLoading(false);
      return;
    }

    setStep("otp");
    setCountdown(60);
    setIsLoading(false);
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    void sendCode();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    setError(null);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (verifyError) {
      setError(verifyError.message);
      setIsLoading(false);
      return;
    }

    if (!data?.session) {
      setError("No session returned. Please retry login.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.replace(redirectTo);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_600px_at_70%_-10%,rgba(30,159,255,0.16),transparent_60%),linear-gradient(180deg,#0B0F15_0%,#0F141C_45%,#111827_100%)] flex items-center justify-center px-4 font-sans relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[520px] h-[520px] bg-[#1E9FFF]/12 rounded-full blur-[110px]"></div>
        <div className="absolute bottom-[-12%] left-[-10%] w-[620px] h-[620px] bg-[#1E9FFF]/8 rounded-full blur-[140px]"></div>
      </div>

      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => router.push("/")}
          className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors group text-sm font-medium"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          返回首页
        </button>
      </div>

      <div className="w-full max-w-md bg-white backdrop-blur-xl border border-[#E7EEF6] shadow-[0_30px_80px_rgba(0,0,0,0.35)] rounded-2xl p-8 md:p-10 relative z-10 transition-all duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1E9FFF] rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-[#1E9FFF]/35">
            P
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === "email" ? "欢迎来到 Prompt OS" : "输入验证码"}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {step === "email" ? (
              "登录以开始 30 天免费试用，无需密码"
            ) : (
              <span>
                验证码已发送至{" "}
                <span className="text-slate-800 font-medium">{email}</span>
              </span>
            )}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === "email" && (
          <form
            className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300"
            onSubmit={handleSendCode}
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Work Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-3.5 text-slate-400"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#6BB7FF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E9FFF] focus:border-[#1E9FFF] transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="name@company.com"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-[#1E9FFF] hover:bg-[#4CB2FF] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1E9FFF]/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  获取验证码 <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === "otp" && (
          <form
            className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300"
            onSubmit={handleVerify}
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Verification Code
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-3.5 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#6BB7FF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E9FFF] focus:border-[#1E9FFF] transition-all text-slate-900 placeholder:text-slate-400 tracking-widest font-mono text-lg"
                  placeholder="12345678"
                  maxLength={8}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 8}
              className="w-full bg-[#1E9FFF] hover:bg-[#4CB2FF] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1E9FFF]/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  进入 Prompt OS <CheckCircle size={18} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-sm mt-4">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                更换邮箱
              </button>
              <button
                type="button"
                disabled={countdown > 0}
                onClick={() => void sendCode()}
                className={`font-medium transition-colors ${
                  countdown > 0
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-[#1E9FFF] hover:text-[#4CB2FF]"
                }`}
              >
                {countdown > 0 ? `${countdown}秒后重新发送` : "重新发送验证码"}
              </button>
            </div>
          </form>
        )}

        {/* Trial Details Footer */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <details className="group text-sm text-slate-500 cursor-pointer">
            <summary className="text-center text-slate-400 hover:text-[#1E9FFF] font-medium list-none flex items-center justify-center gap-1 transition-colors select-none">
              查看 30 天试用特权
              <span className="group-open:rotate-180 transition-transform text-xs">
                ▼
              </span>
            </summary>
            <div className="mt-4 space-y-2 bg-slate-50/80 p-4 rounded-xl text-slate-600 text-xs leading-relaxed border border-slate-100 animate-in fade-in slide-in-from-top-2">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1E9FFF] rounded-full"></span>{" "}
                访问全部 7 套框架、30 个模块
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1E9FFF] rounded-full"></span>{" "}
                Prompt Optimizer 全功能开放
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1E9FFF] rounded-full"></span>{" "}
                试用结束后自动降级为 Free 版
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1E9FFF] rounded-full"></span>{" "}
                无需绑定信用卡，不自动扣费
              </p>
            </div>
          </details>
        </div>

        <p className="text-[10px] text-center mt-8 text-slate-300">
          登录即表示你同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
};
