import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { isAdminRequest } from '@/lib/auth';

/**
 * Persist QA checks for neutrality and bias
 * POST body: { eventId: string, neutralityScore: number, biasCounts: { '-2': number; '-1': number; '0': number; '1': number; '2': number } }
 */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getServerSupabase();
  const body = await req.json().catch(() => null);
  if (!body || !body.eventId) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const { eventId, neutralityScore, biasCounts } = body;
  const { data, error } = await supabase
    .from('qa_checks')
    .insert({
      event_id: eventId,
      neutrality_score: neutralityScore,
      bias_counts: biasCounts,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}

