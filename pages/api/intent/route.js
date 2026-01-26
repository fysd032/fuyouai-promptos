export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST is supported." });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing request text." });
  }

  const planId = `plan_${Date.now()}`;
  const summary = `You want to: ${text.trim().slice(0, 160)}`;
  const questions = [
    {
      id: "audience",
      label: "Who is the target audience?",
      type: "text",
    },
    {
      id: "tone",
      label: "What tone should the output use?",
      type: "select",
      options: ["Professional", "Friendly", "Concise", "Bold"],
    },
  ];

  return res.status(200).json({
    plan_id: planId,
    summary,
    questions,
  });
}
