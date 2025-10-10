import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.event_id || !body.lang) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const { event_id, lang, neutral_summary, neutral_detail } = body;
  const { error } = await supabase
    .from('summaries')
    .upsert({ event_id, lang, neutral_summary, neutral_detail, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase
    .from('summary_edits')
    .insert({ event_id, lang, old_summary: '', new_summary: neutral_summary || '', old_detail: '', new_detail: neutral_detail || '' });
  return NextResponse.json({ ok: true });
}

