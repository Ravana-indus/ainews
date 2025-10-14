import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get('lang') || 'en') as 'en'|'si'|'ta';
  const { data: e, error } = await supabase
    .from('events')
    .select('id, canonical_title, category, last_updated_at, importance_score')
    .eq('id', params.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!e) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: sums } = await supabase
    .from('summaries')
    .select('event_id, lang, neutral_summary, neutral_detail, confidence')
    .eq('event_id', params.id);

  const get = (lc: 'en'|'si'|'ta') => ((sums || []).find((x: any) => x.lang === lc) || { neutral_summary: '', neutral_detail: '', confidence: 0 }) as { neutral_summary: string; neutral_detail: string; confidence: number };

  const result = {
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

  return NextResponse.json(result);
}
