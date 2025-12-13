"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [promptKey, setPromptKey] = useState("A1-01");
  const [moduleId, setModuleId] = useState("");
  const [mode, setMode] = useState("default");
  const [result, setResult] = useState("");

const callAPI = async () => {
  const safePromptKey = promptKey?.trim() || "A1-01";

  if (!text.trim()) {
    alert("请输入 userInput");
    return;
  }

  setResult("请求中…");

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      promptKey: safePromptKey,
      moduleId: moduleId?.trim() || undefined,
      mode: mode || "default",
      userInput: text,
    }),
  });

  const data = await res.json();
  setResult(JSON.stringify(data, null, 2));
};

  return (
    <main style={{ padding: 40, maxWidth: 900 }}>
      <h1>PromptOS Test UI</h1>

      {/* User Input */}
      <div style={{ marginBottom: 16 }}>
        <label>用户输入（userInput）</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ width: "100%" }}
          placeholder="输入你的内容…"
        />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label>promptKey</label>
          <input
            value={promptKey}
            onChange={(e) => setPromptKey(e.target.value)}
            style={{ width: "100%" }}
            placeholder="A1-01 / A1-02 / B2-01"
          />
        </div>

        <div style={{ flex: 1 }}>
          <label>moduleId（可空）</label>
          <input
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            style={{ width: "100%" }}
            placeholder="general / strategy / writing"
          />
        </div>

        <div style={{ flex: 1 }}>
          <label>mode</label>
          <input
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ width: "100%" }}
            placeholder="default / debug"
          />
        </div>
      </div>

      {/* Action */}
      <button onClick={callAPI} style={{ marginTop: 12 }}>
        调用 Generate API
      </button>

      {/* Result */}
      <pre
        style={{
          marginTop: 20,
          background: "#eee",
          padding: 20,
          whiteSpace: "pre-wrap",
        }}
      >
        {result}
      </pre>
    </main>
  );
}
