// app/api/test-trial/route.ts

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "test-trial api is alive",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
