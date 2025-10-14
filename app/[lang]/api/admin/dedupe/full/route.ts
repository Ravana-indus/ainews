import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { dedupeRecentEventsDetailed } from '@/lib/ai/dedupe';

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const threshold = Math.max(0.6, Math.min(0.99, Number(body?.threshold ?? 0.84)));
  const batchLimit = Math.max(100, Math.min(2000, Number(body?.limit ?? 1000)));
  const maxIterations = Math.max(1, Math.min(50, Number(body?.maxIterations ?? 10)));
  const dryRun = !!body?.dryRun;

  let totalMerged = 0;
  const mergedDetails: any[] = [];
  for (let i = 0; i < maxIterations; i++) {
    const res = await dedupeRecentEventsDetailed(threshold, batchLimit, dryRun);
    totalMerged += res.merged;
    mergedDetails.push(...res.details);
    // Stop if no merges found
    if (res.merged === 0) break;
    // small delay between iterations
    await new Promise(r => setTimeout(r, 200));
  }

  return NextResponse.json({ ok: true, merged: totalMerged, iterations: maxIterations, threshold, limit: batchLimit, dryRun, details: mergedDetails.slice(0, 50) });
}

