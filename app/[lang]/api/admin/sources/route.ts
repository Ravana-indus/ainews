import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  const { data, error } = await supabase.from('sources').select('id, name, domain, language, reliability, logo_url, rss_url, enabled').order('name', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: data || [] });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || !body.name || !body.domain || !body.language) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const { name, domain, language, reliability, logo_url, rss_url, enabled } = body;
  const { data, error } = await supabase.from('sources').insert({ name, domain, language, reliability, logo_url, rss_url, enabled }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ source: data });
}

export async function PATCH(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || !body.id) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const { id, ...rest } = body;
  const { data, error } = await supabase.from('sources').update(rest).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ source: data });
}

export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Source ID required' }, { status: 400 });

  // Check if source has any articles before deleting
  const { data: articles } = await supabase
    .from('articles')
    .select('id')
    .eq('source_id', id)
    .limit(1);

  if (articles && articles.length > 0) {
    return NextResponse.json({
      error: 'Cannot delete source with existing articles. Please delete articles first or disable the source instead.'
    }, { status: 400 });
  }

  const { error } = await supabase.from('sources').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
