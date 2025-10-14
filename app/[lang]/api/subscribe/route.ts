import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.email || !body.lang) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const email = String(body.email).toLowerCase();
  const lang = String(body.lang);
  if (!['en','si','ta'].includes(lang)) return NextResponse.json({ error: 'Invalid lang' }, { status: 400 });
  const { error } = await supabase.from('newsletter_subscriptions').insert({ email, lang });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

