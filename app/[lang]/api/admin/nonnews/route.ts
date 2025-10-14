import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  const minSources: number = Math.max(0, Number(body?.minSources ?? 2));
  const requireSummary: boolean = body?.requireSummary !== undefined ? !!body.requireSummary : true;
  const limit: number = Math.max(10, Math.min(1000, Number(body?.limit ?? 500)));

  let toFlag: string[] = [];

  if (ids.length) {
    toFlag = ids;
  } else {
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .order('last_updated_at', { ascending: false })
      .limit(limit);
    const evIds = (events || []).map((e: any) => e.id);
    if (!evIds.length) return NextResponse.json({ ok: true, flagged: 0, ids: [] });

    // Fetch coverage counts
    const { data: cov } = await supabase
      .from('event_source_coverage')
      .select('event_id')
      .in('event_id', evIds);
    const coverageCounts = new Map<string, number>();
    (cov || []).forEach((c: any) => {
      coverageCounts.set(c.event_id, (coverageCounts.get(c.event_id) || 0) + 1);
    });

    // Fetch EN summaries
    let summarized = new Set<string>();
    if (requireSummary) {
      const { data: sums } = await supabase
        .from('summaries')
        .select('event_id')
        .in('event_id', evIds)
        .eq('lang', 'en');
      summarized = new Set((sums || []).map((s: any) => s.event_id));
    }

    toFlag = evIds.filter((id) => {
      const covCount = coverageCounts.get(id) || 0;
      const hasSummary = requireSummary ? summarized.has(id) : true;
      return covCount < minSources || !hasSummary;
    });
  }

  if (!toFlag.length) return NextResponse.json({ ok: true, flagged: 0, ids: [] });

  const { error } = await supabase.from('events').update({ is_news: false }).in('id', toFlag);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, flagged: toFlag.length, ids: toFlag });
}

