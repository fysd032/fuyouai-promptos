"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Trash2, ChevronRight, History, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/src/lib/supabaseClient";

type Conversation = {
  id: string;
  title: string | null;
  source: string | null;
  current_module: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function moduleLabel(module: string | null): string {
  if (!module) return "Core";
  // General module format: "frontModuleId::variantId"
  if (module.includes("::")) {
    const [frontId] = module.split("::");
    const generalMap: Record<string, string> = {
      writing_master: "Writing Master",
      summarizer: "Summarizer",
      copywriter: "Copywriter",
      role_playing: "Role Playing",
      storyteller: "Storyteller",
      rewriter: "Rewriter",
      writing_editor_inspector: "Writing Editor",
      deep_analysis: "Deep Analysis",
      researcher: "Researcher",
      data_interpreter: "Data Interpreter",
      market_insights: "Market Insights",
      interview_gen: "Interview Gen",
      email_pro: "Email Pro",
      pitch_deck: "Pitch Deck",
      decision_maker: "Decision Maker",
      sop_engine: "SOP Engine",
      pm_okr: "PM / OKR",
      biz_model: "Biz Model",
      meta_prompt: "Meta Prompt",
      multi_agent: "Multi-Agent",
      nocode_automation: "No-Code Automation",
      risk_control: "Risk Control",
      knowledge_base: "Knowledge Base",
      ppt_architect: "PPT Architect",
      product_spec: "Product Spec",
      paper_reader: "Paper Reader",
      academic_study: "Academic Study",
      course_design: "Course Design",
      explainer: "Explainer",
      tech_stack: "Tech Stack",
      debugger: "Debugger",
    };
    return generalMap[frontId] ?? frontId;
  }
  // Core framework format
  const coreMap: Record<string, string> = {
    task_breakdown: "Task Decomposition",
    cot_reasoning: "CoT Reasoning",
    content_builder: "Content Generation",
    analytical_engine: "Deep Analysis",
    task_tree: "Complex Task Tree",
  };
  return coreMap[module] ?? module;
}

function continueUrl(conv: Conversation): string {
  if (conv.source === "general" && conv.current_module?.includes("::")) {
    const [frontModuleId, variantId] = conv.current_module.split("::");
    return `/modules/general/${frontModuleId}/${variantId}/run`;
  }
  return `/modules/core?conv=${conv.id}`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Please sign in to view history");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to load history");
      } else {
        setConversations(data.conversations ?? []);
      }
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-1 sm:pt-2">
        <div className="p-2 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
          <History size={20} />
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold text-[#F9FAFB] tracking-tight">
            Session History
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Your past module sessions — continue or review anytime
          </p>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-[#6B7280]">
          <Loader2 size={28} className="animate-spin mr-3" />
          <span>Loading history...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && conversations.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-[#6B7280] space-y-4 py-20">
          <MessageSquare size={48} className="opacity-20" />
          <div className="text-center">
            <p className="text-base font-medium text-[#9CA3AF]">No sessions yet</p>
            <p className="text-sm mt-1">
              Run a module to start a session — it will appear here automatically.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && conversations.length > 0 && (
        <div className="space-y-2 pb-10">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="group flex items-center gap-4 px-4 py-4 bg-[#111827] border border-[#1F2937] rounded-xl hover:border-[#374151] transition-all"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6]">
                <MessageSquare size={16} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F9FAFB] truncate">
                  {conv.title || "(No title)"}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[#6B7280] bg-[#1F2937] px-2 py-0.5 rounded-md">
                    {moduleLabel(conv.current_module)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                    <Clock size={11} />
                    {formatTime(conv.updated_at)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDelete(conv.id)}
                  disabled={deleting === conv.id}
                  className="p-2 rounded-lg text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete conversation"
                >
                  {deleting === conv.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
                <button
                  onClick={() => router.push(continueUrl(conv))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#3B82F6] hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Continue
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
