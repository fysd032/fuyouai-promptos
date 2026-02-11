// src/components/WritingMaster.tsx

"use client";

import { useState } from "react";
import {
  getVariants,
  getDefaultVariantId,
  getBackendModules
} from "@/src/config/moduleMapping";

// 这里可以先约定一个后端接口地址，后面你按实际情况改
const AI_API_URL = `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/generate`;

interface AiRequestPayload {
  frontModuleId: string;
  variantId: string;
  // 如果你想走“胖后端”模式，可以不用传 backendModules
  backendModules?: ReturnType<typeof getBackendModules>;
  input: {
    text: string;
    [key: string]: any;
  };
}

interface AiResponseData {
  output?: string;
  [key: string]: any;
}

export function WritingMaster() {
  const frontModuleId = "writing_master";

  // 从映射表里拿到所有写作大师的模式（variants）
  const variants = getVariants(frontModuleId);

  const [variantId, setVariantId] = useState(
    getDefaultVariantId(frontModuleId) ?? "longform_article"
  );
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!text.trim()) {
      setError("Please enter a writing topic or key points first.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      // 👉 从映射表中拿到 backendModules（如果后端要用）
      const backendModules = getBackendModules(frontModuleId, variantId);

      const payload: AiRequestPayload = {
        frontModuleId,
        variantId,
        // 如果你的后端暂时不需要 backendModules，可以先注释掉这行
        backendModules,
        input: {
          text
        }
      };

      console.log("Request payload:", payload);

      const res = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`API returned error status: ${res.status}`);
      }

      const data: AiResponseData = await res.json();

      // 按你的后端返回结构调整这里的字段
      const output =
        typeof data.output === "string"
          ? data.output
          : JSON.stringify(data, null, 2);

      setResult(output);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "API call failed");
    } finally {
      setLoading(false);
    }
  };

  if (!variants.length) {
    return <div>No configuration found for frontModuleId = "writing_master" in mapping.</div>;
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
        Writing Master · Demo
      </h1>

      {/* 模式选择 */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Select Writing Mode:</label>
        <select
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
        >
          {variants.map((v) => (
            <option key={v.variantId} value={v.variantId}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* 用户输入 */}
      <div style={{ marginBottom: 12 }}>
        <textarea
          rows={8}
          style={{ width: "100%", boxSizing: "border-box" }}
          placeholder="Enter writing topic, background, key points, etc..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* 操作按钮 */}
      <button onClick={handleRun} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {/* 错误提示 */}
      {error && (
        <div style={{ color: "red", marginTop: 8 }}>
          {error}
        </div>
      )}

      {/* 输出结果 */}
      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f5f5f5",
            whiteSpace: "pre-wrap",
            borderRadius: 4
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
