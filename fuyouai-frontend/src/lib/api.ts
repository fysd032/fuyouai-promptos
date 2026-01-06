const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "");

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not defined");
}

export async function generate(payload: {
  moduleId?: string;
  promptKey?: string;
  mode?: string;
  userInput: string;
}) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  try {
    return {
      __httpStatus: res.status,
      ...JSON.parse(text),
    };
  } catch {
    return {
      ok: false,
      __httpStatus: res.status,
      error: "Non-JSON response",
      raw: text,
    };
  }
}

