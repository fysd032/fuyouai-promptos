export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST is supported." });
  }

  const { plan_id, text, answers, refineInstruction, previousOutput } =
    req.body || {};

  if (!plan_id || !text) {
    return res.status(400).json({ error: "Missing plan_id or text." });
  }

  const answerLines = Object.entries(answers || {})
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  const refinement = refineInstruction
    ? `\nRefinement request:\n${refineInstruction}\n`
    : "";

  const previous = previousOutput
    ? `\nPrevious output summary:\n${String(previousOutput).slice(0, 300)}\n`
    : "";

  const output = [
    "Here is a structured response based on your request:",
    "",
    `Request: ${text}`,
    answerLines ? `\nAnswers:\n${answerLines}` : "",
    refinement,
    previous,
    "Next steps:",
    "1) Draft the first version.",
    "2) Review for clarity and tone.",
    "3) Finalize and deliver.",
  ]
    .filter(Boolean)
    .join("\n");

  return res.status(200).json({ output });
}
