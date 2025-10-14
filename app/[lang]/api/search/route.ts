import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const lang = (searchParams.get('lang') || 'en') as 'en'|'si'|'ta';
  let eventsQuery = supabase
    .from('events')
    .select('id, canonical_title, category, last_updated_at, importance_score')
    .order('last_updated_at', { ascending: false })
    .limit(50);
  if (q) {
    // trigram-based fuzzy search on canonical_title
    eventsQuery = eventsQuery.textSearch('canonical_title', q, { type: 'websearch' });
  }
  const { data: evts, error } = await eventsQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (evts || []).map((e) => e.id);
  const { data: sums } = await supabase
    .from('summaries')
    .select('event_id, lang, neutral_summary, neutral_detail, confidence')
    .in('event_id', ids);

  const byEvent: Record<string, any[]> = {};
  (sums || []).forEach((s) => {
    byEvent[s.event_id] = byEvent[s.event_id] || [];
    byEvent[s.event_id].push(s);
  });

  const result = (evts || []).map((e) => {
    const list = byEvent[e.id] || [];
    const get = (lc: 'en'|'si'|'ta') => (list.find((x) => x.lang === lc) || { neutral_summary: '', neutral_detail: '', confidence: 0 }) as { neutral_summary: string; neutral_detail: string; confidence: number };
    return {
      id: e.id,
      title: e.canonical_title,
      summary: { en: get('en').neutral_summary || '', si: get('si').neutral_summary || '', ta: get('ta').neutral_summary || '' },
      detail: { en: get('en').neutral_detail || '', si: get('si').neutral_detail || '', ta: get('ta').neutral_detail || '' },
      updatedAt: e.last_updated_at,
      confidence: Math.round(get(lang).confidence || e.importance_score || 0),
      category: e.category,
      sources: [],
      biasSummary: [],
    };
  });

  return NextResponse.json({ events: result });
}
