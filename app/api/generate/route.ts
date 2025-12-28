export async function POST(req: Request) {
  try {
    console.log('[generate] start');

    console.log('[generate] WORKER_URL =', process.env.WORKER_URL);

    const res = await fetch(`${process.env.WORKER_URL}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await req.json()),
    });

    console.log('[generate] worker status:', res.status);

    const text = await res.text();
    console.log('[generate] worker response text:', text);

    if (!res.ok) {
      throw new Error(`Worker responded with ${res.status}: ${text}`);
    }

    return new Response(text, { status: 200 });
  } catch (err) {
    console.error('[generate] ERROR:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
}


