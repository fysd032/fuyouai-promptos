import mapping from "@/module_mapping.v2.json";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, version: "v2", data: mapping }, null, 2),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/json; charset=utf-8",
      },
    }
  );
}
