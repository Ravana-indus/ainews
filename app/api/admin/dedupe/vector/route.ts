import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { dedupeByVectorDetailed } from '@/lib/ai/dedupe';

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const threshold = Math.max(0.5, Math.min(0.99, Number(body?.threshold ?? 0.92)));
  const limit = Math.max(10, Math.min(1000, Number(body?.limit ?? 200)));
  const dryRun = !!body?.dryRun;
  const res = await dedupeByVectorDetailed(threshold, limit, dryRun);
  return NextResponse.json({ ok: true, ...res, threshold, limit, dryRun });
}

