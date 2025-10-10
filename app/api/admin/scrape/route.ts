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

  // Do NOT create an event here. The pipeline will cluster articles into events.
  logs.push('Article stored; queued for clustering by pipeline');

  return NextResponse.json({
    ok: true,
    article: { id: articleId, title: article.title, contentLength: article.content.length },
    logs,
    errors,
  });
}
