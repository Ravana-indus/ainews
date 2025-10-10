import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { isAdminRequest } from '@/lib/auth';
import { scrapeArticleWithDiagnostics } from '@/lib/scraper';

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
  const url = body?.url;

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const logs: string[] = [];
  const errors: string[] = [];

  logs.push(`Admin scrape request for: ${url}`);

  const supabase = getServerSupabase();

  // Scrape the article
  const scrapeResult = await scrapeArticleWithDiagnostics(url);

  // Add scraper logs
  scrapeResult.logs.forEach(log => logs.push(`[SCRAPER] ${log}`));
  scrapeResult.errors.forEach(err => errors.push(`Scraper: ${err}`));

  if (!scrapeResult.article) {
    logs.push('Scraping failed - no article extracted');
    return NextResponse.json({ ok: false, errors, logs });
  }

  const article = scrapeResult.article;
  logs.push(`Article scraped: "${article.title}"`);

  // Find or create source
  const domain = domainFromUrl(url);
  let sourceId: string | null = null;

  if (domain) {
    const { data: existingSource } = await supabase
      .from('sources')
      .select('id')
      .eq('domain', domain)
      .maybeSingle();

    if (existingSource) {
      sourceId = existingSource.id;
      logs.push(`Found existing source: ${domain}`);
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

  // Check for duplicate URL
  const { data: existingArticle } = await supabase
    .from('articles')
    .select('id')
    .eq('url', url)
    .maybeSingle();

  let articleId: string | null = null;

  if (existingArticle) {
    articleId = existingArticle.id;
    logs.push('Article URL already exists in database');
  } else {
    // Create article
    const { data: newArticle, error: artErr } = await supabase
      .from('articles')
      .insert({
        source_id: sourceId,
        url: article.url,
        title: article.title,
        content_text: article.content,
        author: article.author || null,
        published_at: article.publishedAt,
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
    logs.push(`Article created with ID: ${articleId}`);
  }

  // Create event
  const { data: evt, error: evtErr } = await supabase
    .from('events')
    .insert({
      canonical_title: article.title,
      category: 'General',
      last_updated_at: new Date().toISOString(),
      importance_score: 60,
    })
    .select('id, canonical_title')
    .single();

  if (evtErr || !evt) {
    errors.push(`Failed to create event: ${evtErr?.message || 'unknown'}`);
    return NextResponse.json({ ok: false, errors, logs });
  }

  logs.push(`Event created: ${evt.id}`);

  // Create summary
  const summary = article.content.substring(0, 500) + (article.content.length > 500 ? '...' : '');
  await supabase
    .from('summaries')
    .insert({
      event_id: evt.id,
      lang: 'en',
      neutral_summary: summary,
      neutral_detail: article.content,
      confidence: 70,
    });

  // Create coverage
  await supabase
    .from('event_source_coverage')
    .insert({
      event_id: evt.id,
      source_id: sourceId,
      headline: article.title,
      lean: 0,
      reason: 'Scraped from web',
      url: article.url,
      published_at: article.publishedAt,
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
        lean_reason: 'Directly scraped',
      });
  }

  logs.push('Event fully created with all relationships');

  return NextResponse.json({
    ok: true,
    event: { id: evt.id, title: evt.canonical_title },
    article: { title: article.title, contentLength: article.content.length },
    logs,
    errors,
  });
}
