import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getServerSupabase();
  const url = new URL(req.url);
  const limit = Math.max(10, Math.min(500, Number(url.searchParams.get('limit') || '100')));

  const { data: events } = await supabase
    .from('events')
    .select('id, canonical_title, last_updated_at')
    .order('last_updated_at', { ascending: false })
    .limit(limit);
  const evIds = (events || []).map((e: any) => e.id);
  let coverageCounts: Record<string, number> = {};
  if (evIds.length) {
    const { data: cov } = await supabase
      .from('event_source_coverage')
      .select('event_id')
      .in('event_id', evIds);
    (cov || []).forEach((c: any) => {
      coverageCounts[c.event_id] = (coverageCounts[c.event_id] || 0) + 1;
    });
  }
  const out = (events || []).map((e: any) => ({
    id: e.id,
    title: e.canonical_title,
    updatedAt: e.last_updated_at,
    coverage: coverageCounts[e.id] || 0,
  }));
  return NextResponse.json({ ok: true, events: out });
}

