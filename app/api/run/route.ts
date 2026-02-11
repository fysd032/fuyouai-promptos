import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { plan_id, text, answers, refineInstruction, previousOutput } = body || {};

  if (!plan_id || !text) {
    return NextResponse.json({ error: "Missing plan_id or text." }, { status: 400 });
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

  return NextResponse.json({ output });
}
