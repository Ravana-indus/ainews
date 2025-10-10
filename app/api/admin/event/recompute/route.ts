import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabaseServer';
import { summarizeEventInAllLanguages, saveSummaries } from '@/lib/ai/summarize';
import { detectBiasForEvent } from '@/lib/ai/bias';

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const eventId: string = body?.eventId || '';
  if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

  // Re-summarize
  const sums = await summarizeEventInAllLanguages(eventId);
  if (sums) await saveSummaries(eventId, sums);

  // Re-run bias detection
  const bias = await detectBiasForEvent(eventId);

  return NextResponse.json({ ok: true, eventId, summaries: !!sums, bias });
}

