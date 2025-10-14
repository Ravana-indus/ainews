import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { isAdminRequest } from '@/lib/auth';

function domainFromUrl(href: string): string | null {
  try {
    const u = new URL(href);
    return (u.hostname || '').replace(/^www\./, '');
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { title, url, content, source } = body || {};

  if (!title || !url) {
    return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
  }

  const logs: string[] = [];
  const errors: string[] = [];

  logs.push(`Manual entry: "${title}"`);

  const supabase = getServerSupabase();

  // Determine source ID
  let sourceId: string | null = source || null;

  if (!sourceId) {
    const domain = domainFromUrl(url);
    if (domain) {
      const { data: existingSource } = await supabase
        .from('sources')
        .select('id')
        .eq('domain', domain)
        .maybeSingle();

      if (existingSource) {
        sourceId = existingSource.id;
        logs.push(`Using existing source: ${domain}`);
      } else {
        const { data: newSource, error: srcErr } = await supabase
          .from('sources')
          .insert({ name: domain, domain, language: 'en', reliability: 0.7, enabled: true })
          .select('id')
          .single();

        if (srcErr) {
          errors.push(`Failed to create source: ${srcErr.message}`);
        } else if (newSource) {
          sourceId = newSource.id;
          logs.push(`Created new source: ${domain}`);
        }
      }
    }
  }

  // Check for duplicate URL
  const { data: existingArticle } = await supabase
    .from('articles')
    .select('id')
    .eq('url', url)
    .maybeSingle();

  let articleId: string | null = null;

  if (existingArticle) {
    articleId = existingArticle.id;
    logs.push('Article URL already exists');
  } else {
    // Create article
    const { data: newArticle, error: artErr } = await supabase
      .from('articles')
      .insert({
        source_id: sourceId,
        url,
        title,
        content_text: content || '',
        published_at: new Date().toISOString(),
        language: 'en',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (artErr) {
      errors.push(`Failed to create article: ${artErr.message}`);
      return NextResponse.json({ ok: false, errors, logs });
    }

    articleId = newArticle.id;
    logs.push(`Article created: ${articleId}`);
  }

  // If content empty, try to fetch page text quickly
  if (!content) {
    try {
      const txt = await (await fetch(url, { headers: { 'Accept': 'text/html' } })).text();
      const onlyText = txt.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000);
      if (onlyText) {
        await supabase.from('articles').update({ content_text: onlyText }).eq('id', articleId);
        logs.push('filled content from page');
      }
    } catch {}
  }

  // Create event
  const { data: evt, error: evtErr } = await supabase
    .from('events')
    .insert({
      canonical_title: title,
      category: 'General',
      last_updated_at: new Date().toISOString(),
      importance_score: 50,
    })
    .select('id, canonical_title')
    .single();

  if (evtErr || !evt) {
    errors.push(`Failed to create event: ${evtErr?.message || 'unknown'}`);
    return NextResponse.json({ ok: false, errors, logs });
  }

  logs.push(`Event created: ${evt.id}`);

  // Create summary
  const summary = content
    ? (content.substring(0, 500) + (content.length > 500 ? '...' : ''))
    : `Manual entry: ${title}`;

  await supabase
    .from('summaries')
    .insert({
      event_id: evt.id,
      lang: 'en',
      neutral_summary: summary,
      neutral_detail: content || '',
      confidence: 50,
    });

  // Create coverage
  await supabase
    .from('event_source_coverage')
    .insert({
      event_id: evt.id,
      source_id: sourceId,
      headline: title,
      lean: 0,
      reason: 'Manual entry',
      url,
      published_at: new Date().toISOString(),
    });

  // Create event-article relationship
  if (articleId) {
    await supabase
      .from('event_articles')
      .insert({
        event_id: evt.id,
        article_id: articleId,
        similarity: 1.0,
        stance_score: 0,
        lean_reason: 'Manual entry',
      });
  }

  logs.push('Event fully created');

  return NextResponse.json({
    ok: true,
    event: { id: evt.id, title: evt.canonical_title },
    logs,
    errors,
  });
}
