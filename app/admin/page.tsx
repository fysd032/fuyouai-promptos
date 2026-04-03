"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import {
  Users, MessageSquare, Zap, AlertCircle, BarChart2,
  RefreshCw, Loader2, Clock, CheckCircle, XCircle,
} from "lucide-react";

type ModuleRankItem = { module: string; total: number; success: number; error: number };
type RunItem = {
  id: string;
  user_id: string;
  target_module: string;
  target_engine: string;
  status: string;
  latency_ms: number | null;
  token_usage_input: number | null;
  token_usage_output: number | null;
  error_message: string | null;
  created_at: string;
};
type ErrorItem = {
  id: string;
  user_id: string;
  target_module: string;
  target_engine: string;
  error_message: string | null;
  created_at: string;
};

type Stats = {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  recentRuns: RunItem[];
  moduleRanking: ModuleRankItem[];
  errorRuns: ErrorItem[];
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Stat({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string;
}) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-[#6B7280] mt-1">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to load stats");
      } else {
        setStats(data.stats);
      }
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-[#0B0F15] text-[#F9FAFB] p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-[#6B7280] mt-1">Internal ops panel — restricted access</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[#111827] border border-[#1F2937] rounded-xl text-[#9CA3AF] hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>

        {loading && !stats && (
          <div className="flex items-center justify-center py-20 text-[#6B7280]">
            <Loader2 size={28} className="animate-spin mr-3" />
            Loading...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {stats && (
          <div className="space-y-8">
            {/* Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat icon={Users}        label="Total Users"         value={stats.totalUsers}         color="bg-blue-500/10 text-blue-400" />
              <Stat icon={MessageSquare} label="Total Conversations" value={stats.totalConversations} color="bg-purple-500/10 text-purple-400" />
              <Stat icon={MessageSquare} label="Total Messages"      value={stats.totalMessages}      color="bg-cyan-500/10 text-cyan-400" />
              <Stat icon={Zap}           label="Total Runs (sampled)" value={stats.moduleRanking.reduce((s, r) => s + r.total, 0)} color="bg-emerald-500/10 text-emerald-400" />
            </div>

            {/* Module Ranking + Error Runs side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Module Ranking */}
              <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1F2937]">
                  <BarChart2 size={16} className="text-[#3B82F6]" />
                  <span className="text-sm font-medium">Module Usage Ranking</span>
                </div>
                <div className="divide-y divide-[#1F2937]">
                  {stats.moduleRanking.length === 0 && (
                    <p className="px-5 py-4 text-sm text-[#6B7280]">No data yet</p>
                  )}
                  {stats.moduleRanking.map((item, i) => (
                    <div key={item.module} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xs text-[#6B7280] w-5 text-right">{i + 1}</span>
                      <span className="flex-1 text-sm text-[#F9FAFB] truncate">{item.module}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400">{item.success} ok</span>
                        {item.error > 0 && <span className="text-red-400">{item.error} err</span>}
                        <span className="text-[#6B7280] font-medium">{item.total} total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Runs */}
              <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1F2937]">
                  <XCircle size={16} className="text-red-400" />
                  <span className="text-sm font-medium">Recent Errors</span>
                  <span className="ml-auto text-xs text-[#6B7280]">last 20</span>
                </div>
                <div className="divide-y divide-[#1F2937] max-h-[320px] overflow-y-auto">
                  {stats.errorRuns.length === 0 && (
                    <p className="px-5 py-4 text-sm text-[#6B7280]">No errors — great!</p>
                  )}
                  {stats.errorRuns.map((run) => (
                    <div key={run.id} className="px-5 py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#F9FAFB]">{run.target_module}</span>
                        <span className="text-xs text-[#6B7280]">{timeAgo(run.created_at)}</span>
                      </div>
                      <p className="text-xs text-red-400 truncate">{run.error_message ?? "Unknown error"}</p>
                      <p className="text-[10px] text-[#4B5563] font-mono truncate">{run.user_id}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Runs Table */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1F2937]">
                <Clock size={16} className="text-[#9CA3AF]" />
                <span className="text-sm font-medium">Recent Module Runs</span>
                <span className="ml-auto text-xs text-[#6B7280]">last 20</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#6B7280] border-b border-[#1F2937]">
                      <th className="px-5 py-2.5 text-left font-medium">Module</th>
                      <th className="px-4 py-2.5 text-left font-medium">Engine</th>
                      <th className="px-4 py-2.5 text-left font-medium">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium">Latency</th>
                      <th className="px-4 py-2.5 text-right font-medium">Tokens in/out</th>
                      <th className="px-4 py-2.5 text-right font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937]">
                    {stats.recentRuns.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-6 text-center text-[#6B7280]">
                          No runs yet
                        </td>
                      </tr>
                    )}
                    {stats.recentRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-[#1F2937]/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-[#F9FAFB]">{run.target_module}</td>
                        <td className="px-4 py-3 text-[#9CA3AF]">{run.target_engine}</td>
                        <td className="px-4 py-3">
                          {run.status === "success" ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle size={11} /> ok
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle size={11} /> err
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-[#9CA3AF]">
                          {run.latency_ms != null ? `${run.latency_ms}ms` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-[#9CA3AF]">
                          {run.token_usage_input != null
                            ? `${run.token_usage_input} / ${run.token_usage_output ?? 0}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-[#6B7280]">{timeAgo(run.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
