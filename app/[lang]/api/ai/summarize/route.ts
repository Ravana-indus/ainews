import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }
  const text: string = body.text;
  const model: string = body.model || 'gpt-5-mini';
  const endpoint: string | undefined = body.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey: string | undefined = body.apiKey || process.env.AZURE_OPENAI_API_KEY;

  if (!endpoint || !apiKey) {
    return NextResponse.json({ error: 'Missing endpoint or apiKey' }, { status: 400 });
  }

  const payload = {
    model,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text },
        ],
      },
    ],
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: json || res.statusText }, { status: res.status });
    }
    return NextResponse.json(json || { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
