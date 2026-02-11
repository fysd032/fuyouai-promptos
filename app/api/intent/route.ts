import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = body?.text;

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing request text." }, { status: 400 });
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

  return NextResponse.json({
    plan_id: planId,
    summary,
    questions,
  });
}
