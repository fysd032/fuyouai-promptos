"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  const callAPI = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promptKey: "A1-01",
        userInput: text
      }),
    });

    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>PromptOS Test UI</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
        placeholder="输入你的内容…"
      />

      <button onClick={callAPI} style={{ marginTop: 20 }}>
        调用 Generate API
      </button>

      <pre style={{ marginTop: 20, background: "#eee", padding: 20 }}>
        {result}
      </pre>
    </main>
  );
}
