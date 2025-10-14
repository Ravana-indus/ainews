import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabaseServer';
import { generateCanonicalTitleLLM } from '@/lib/ai/title';

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const { keepId, dropId } = body || {};
  if (!keepId || !dropId || keepId === dropId) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  // Move coverage and articles
  await supabase.from('event_source_coverage').update({ event_id: keepId }).eq('event_id', dropId);
  await supabase.from('event_articles').update({ event_id: keepId }).eq('event_id', dropId);
  await supabase.from('summaries').delete().eq('event_id', dropId);
  await supabase.from('events').delete().eq('id', dropId);

  // Recompute canonical title via LLM from merged articles
  const { data: evArts } = await supabase
    .from('event_articles')
    .select('article_id')
    .eq('event_id', keepId);
  const articleIds = (evArts || []).map((e: any) => e.article_id);
  const title = await generateCanonicalTitleLLM(articleIds).catch(() => null);
  if (title) await supabase.from('events').update({ canonical_title: title }).eq('id', keepId);

  return NextResponse.json({ ok: true, keepId, dropId, title });
}

