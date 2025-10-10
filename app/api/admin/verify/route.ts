import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { isAdminRequest } from '@/lib/auth';
import { analyzeNeutrality, tallyBias } from '@/lib/quality';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getServerSupabase();
  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get('limit') || '100');
  const limit = Math.max(1, Math.min(500, limitParam));

  // Fetch latest events with summaries and coverage
  const { data: events } = await supabase
    .from('events')
    .select('id, canonical_title, last_updated_at')
    .order('last_updated_at', { ascending: false })
    .limit(limit);

  const out: any[] = [];
  for (const evt of events || []) {
    const { data: enSum } = await supabase
      .from('summaries')
      .select('neutral_summary, confidence')
      .eq('event_id', evt.id)
      .eq('lang', 'en')
      .maybeSingle();
    const { data: cov } = await supabase
      .from('event_source_coverage')
      .select('source_id, headline, lean, reason, url')
      .eq('event_id', evt.id);
    const srcIds = Array.from(new Set((cov || []).map((c: any) => c.source_id).filter(Boolean)));
    const { data: srcs } = srcIds.length
      ? await supabase.from('sources').select('id, name, logo_url').in('id', srcIds)
      : { data: [] as any[] };
    const srcMap = new Map((srcs || []).map((s: any) => [s.id, s]));
    const coverage = (cov || []).map((c: any) => ({
      ...c,
      sourceName: srcMap.get(c.source_id)?.name || 'Unknown',
      logoUrl: srcMap.get(c.source_id)?.logo_url || null,
    }));
    const neutrality = analyzeNeutrality(enSum?.neutral_summary || '');
    const bias = tallyBias(coverage.map((c: any) => c.lean));
    // Filter out non-news events: fewer than 2 sources or missing summary
    const isNews = coverage.length >= 2 && !!enSum?.neutral_summary;
    if (!isNews) continue;
    out.push({
      id: evt.id,
      title: evt.canonical_title,
      updatedAt: evt.last_updated_at,
      neutrality,
      confidence: enSum?.confidence ?? 0,
      bias,
      coverage,
    });
  }

  // Group similar events by normalized title to match same news
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const groups: Record<string, string[]> = {};
  const seenKeys = new Map<string, string>();
  for (const e of out) {
    const key = normalize(e.title).split(' ').slice(0, 6).join(' ');
    const existingKey = seenKeys.get(key);
    if (existingKey) {
      groups[existingKey].push(e.id);
    } else {
      seenKeys.set(key, key);
      groups[key] = [e.id];
    }
  }

  return NextResponse.json({ ok: true, events: out, groups });
}
