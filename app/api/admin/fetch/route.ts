import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { isAdminRequest } from '@/lib/auth';
import { fetchRssItems, fetchRssItemsWithDiagnostics } from '@/lib/rss';
import { fetchLatestLinksFromDomain, scrapeArticleWithDiagnostics } from '@/lib/scraper';

async function azureSummarize(text: string): Promise<string | null> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  // Align with lib/ai/azure.ts which uses AZURE_OPENAI_KEY
  const apiKey = process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY;
  if (!endpoint || !apiKey) return null;
  const payload = {
    model: 'gpt-5-mini',
    input: [
      { role: 'user', content: [{ type: 'input_text', text: `Summarize neutrally in 2–3 sentences:
${text}` }] },
    ],
  };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': apiKey }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok || !json) return null;
    const msg = Array.isArray(json.output) ? json.output.find((o: any) => o.type === 'message') : null;
    const content = msg?.content || [];
    const out = content.find((c: any) => c.type === 'output_text');
    return out?.text || null;
  } catch {
    return null;
  }
}

async function azureTranslate(text: string, target: 'si' | 'ta'): Promise<string | null> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY;
  if (!endpoint || !apiKey) return null;
  const prompt = target === 'si'
    ? `Translate to Sinhala in neutral tone:\n${text}`
    : `Translate to Tamil in neutral tone:\n${text}`;
  const payload = {
    model: 'gpt-5-mini',
    input: [
      { role: 'user', content: [{ type: 'input_text', text: prompt }] },
    ],
  };
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': apiKey }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok || !json) return null;
    const msg = Array.isArray(json.output) ? json.output.find((o: any) => o.type === 'message') : null;
    const content = msg?.content || [];
    const out = content.find((c: any) => c.type === 'output_text');
    return out?.text || null;
  } catch {
    return null;
  }
}

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'Accept': 'text/html' } });
    const html = await res.text();
    const bodyMatch = /<body[\s\S]*?>([\s\S]*?)<\/body>/i.exec(html);
    let body = (bodyMatch ? bodyMatch[1] : html)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!body) return null;
    return body.slice(0, 4000);
  } catch {
    return null;
  }
}

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
  const amount = Math.max(1, Math.min(20, Number(body?.amount ?? 3)));
  const sourceIdFilter: string | null = body?.sourceId || null;
  const logs: string[] = [];
  logs.push(`admin auth ok; amount=${amount}; sourceIdFilter=${sourceIdFilter ?? 'none'}`);
  const supabase = getServerSupabase();
  logs.push(`service role ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing'}; endpoint ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'unset'}`);

  // First, get all sources from the database with their RSS feeds
  const { data: allSources } = await supabase
    .from('sources')
    .select('id, name, domain, rss_url, enabled')
    .eq('enabled', true)
    .order('name', { ascending: true });
  const selectedSources = sourceIdFilter ? (allSources || []).filter((s: any) => s.id === sourceIdFilter) : (allSources || []);
  logs.push(`sources in database: ${(allSources || []).length}; selected: ${selectedSources.length}`);

  // If no articles present, fall back to RSS feeds from sources or well-known feeds
  let arts: any[] = [];
  if (!sourceIdFilter) {
    const { data: artData } = await supabase
      .from('articles')
      .select('id, source_id, title, url, published_at')
      .order('published_at', { ascending: false })
      .limit(amount);
    arts = artData || [];
    logs.push(`supabase articles fetched: ${arts.length}`);
  } else {
    logs.push('skip existing articles fetch due to source filter');
  }
  const created: any[] = [];
  const errors: string[] = [];
  if (!arts.length) {
    // Build feed list from database sources first, then fall back to hardcoded
    const feeds: { url: string; sourceId: string | null; sourceName: string }[] = [];

    // Add feeds from database sources
    if (selectedSources && selectedSources.length) {
      selectedSources.forEach((src: any) => {
        if (src.rss_url) {
          feeds.push({ url: src.rss_url, sourceId: src.id, sourceName: src.name });
          logs.push(`added feed from source: ${src.name} (${src.rss_url})`);
        } else if (src.domain) {
          logs.push(`no RSS for ${src.name}; will probe domain for latest links`);
        }
      });
    }

    // If specific source requested and no RSS configured, continue with domain probing fallback later
    if (sourceIdFilter && feeds.length === 0) {
      const s = selectedSources[0];
      const msg = s ? `No RSS URL configured for source ${s.name}; will attempt domain scraping fallback` : 'Selected source not found or disabled';
      logs.push(msg);
      if (!s) {
        errors.push('Selected source invalid');
        return NextResponse.json({ ok: false, attempted: 0, created: [], errors, logs });
      }
    }

    // Fallback feeds if no sources or RSS configured and no specific source requested
    if (!sourceIdFilter && feeds.length === 0) {
      logs.push('no RSS feeds in sources, using fallback feeds');
      feeds.push(
        { url: 'https://www.dailymirror.lk/rss/latest_news', sourceId: null, sourceName: 'Daily Mirror' },
        { url: 'https://www.adaderana.lk/rss.php', sourceId: null, sourceName: 'Ada Derana' },
        { url: 'https://tamilguardian.com/rss.xml', sourceId: null, sourceName: 'Tamil Guardian' },
        { url: 'https://www.newsfirst.lk/feed/', sourceId: null, sourceName: 'News First' }
      );
    }

    const rss: any[] = [];
    for (const f of feeds) {
      logs.push(`\n=== Fetching RSS from ${f.sourceName} ===`);
      try {
        const result = await fetchRssItemsWithDiagnostics(f.url, amount);

        // Add all RSS diagnostics to main logs
        result.logs.forEach(log => logs.push(`  [RSS] ${log}`));
        result.errors.forEach(err => {
          errors.push(`${f.sourceName}: ${err}`);
          logs.push(`  [ERROR] ${err}`);
        });

        if (result.xmlPreview) {
          logs.push(`  [XML Preview] ${result.xmlPreview.substring(0, 300)}...`);
        }

        logs.push(`  [Result] ${f.sourceName} -> ${result.items.length} items`);

        if (result.items.length === 0) {
          errors.push(`No items returned from ${f.sourceName} RSS feed`);
        }

        result.items.forEach((it) => rss.push({
          source_id: f.sourceId,
          title: it.title,
          url: it.link,
          published_at: it.pubDate
        }));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`RSS fetch failed for ${f.sourceName}: ${errMsg}`);
        logs.push(`  [EXCEPTION] ${errMsg}`);
      }
      if (rss.length >= amount) break;
    }
    // If fewer than requested and a specific source is requested, top up via domain probing + scraping
    if (rss.length < amount && sourceIdFilter && selectedSources[0]?.domain) {
      const domain = selectedSources[0].domain;
      const needed = amount - rss.length;
      logs.push(`\n=== Probing domain for latest links: ${domain} (need ${needed}) ===`);
      const probe = await fetchLatestLinksFromDomain(domain, needed);
      probe.logs.forEach((l) => logs.push(`[DOMAIN] ${l}`));
      probe.errors.forEach((e) => errors.push(`Domain probe: ${e}`));
      // Attempt to scrape each link into an article
      for (const it of probe.items) {
        logs.push(`Scraping link: ${it.link}`);
        const sc = await scrapeArticleWithDiagnostics(it.link);
        sc.logs.forEach((l) => logs.push(`[SCRAPE] ${l}`));
        sc.errors.forEach((e) => errors.push(`Scrape: ${e}`));
        if (sc.article) {
          rss.push({
            source_id: selectedSources[0].id,
            title: sc.article.title,
            url: sc.article.url,
            published_at: sc.article.publishedAt || it.pubDate,
          });
        }
        if (rss.length >= amount) break;
      }
    }
    arts = rss.slice(0, amount);
    logs.push(`\n=== RSS aggregate count: ${arts.length} ===`);
  }
  const attempted = arts.length;
  // Build source domain -> id map
  const domains = Array.from(new Set(arts.map((a) => domainFromUrl(a.url)).filter(Boolean))) as string[];
  const { data: srcs } = domains.length ? await supabase.from('sources').select('id, domain').in('domain', domains) : { data: [] as any[] };
  const srcMap: Record<string, string> = {};
  (srcs || []).forEach((s: any) => { srcMap[s.domain] = s.id; });
  logs.push(`domains=${domains.length}; mapped=${Object.keys(srcMap).length}`);
  // Create missing sources automatically
  for (const d of domains) {
    if (!srcMap[d]) {
      const { data: createdSrc, error: srcErr } = await supabase.from('sources').insert({ name: d, domain: d, language: 'en', reliability: 0.8 }).select('id, domain').single();
      if (srcErr) { errors.push(`create source failed (${d}): ${srcErr.message}`); logs.push(`create source failed (${d})`); }
      if (createdSrc) srcMap[createdSrc.domain] = createdSrc.id;
    }
  }
  for (const a of arts) {
    logs.push(`process: ${a.title?.slice(0,80)}`);
    // Dedup by URL if already covered
    if (a.url) {
      const { data: existingCov } = await supabase.from('event_source_coverage').select('id, event_id').eq('url', a.url).maybeSingle();
      if (existingCov) { logs.push('skip duplicate url in coverage'); continue; }
    }

    // Create or get article entry first
    let articleId = a.id || null;
    if (a.url && !articleId) {
      const { data: existingArticle } = await supabase.from('articles').select('id').eq('url', a.url).maybeSingle();
      if (existingArticle) {
        articleId = existingArticle.id;
        logs.push('article already exists');
      } else {
        // Create article entry
        const articleSourceId = a.source_id || (domainFromUrl(a.url || '') ? srcMap[domainFromUrl(a.url || '') as string] : null);
        const { data: newArticle, error: artInsertErr } = await supabase
          .from('articles')
          .insert({
            source_id: articleSourceId,
            url: a.url,
            title: a.title,
            published_at: a.published_at,
            language: 'en',
            content_text: '',
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();
        if (artInsertErr) {
          errors.push(`create article failed: ${artInsertErr.message}`);
          logs.push('article insert failed');
        } else if (newArticle) {
          articleId = newArticle.id;
          logs.push('article created');
          // If content empty, try to scrape page text
          const pageText = a.url ? await fetchPageText(a.url) : null;
          if (pageText) {
            await supabase.from('articles').update({ content_text: pageText }).eq('id', articleId);
            logs.push('article content scraped');
          }
        }
      }
    }

    const { data: evt, error: evtErr } = await supabase
      .from('events')
      .insert({ canonical_title: a.title, category: 'General', last_updated_at: new Date().toISOString(), importance_score: 50 })
      .select('id, canonical_title')
      .single();
    if (evtErr || !evt) { errors.push(`create event failed: ${evtErr?.message || 'unknown'}`); logs.push('event insert failed'); continue; }
    await supabase
      .from('summaries')
      .insert({ event_id: evt.id, lang: 'en', neutral_summary: `Auto-seeded summary for: ${a.title}`, neutral_detail: '', confidence: 50 });
    const coverageSourceId = a.source_id || (domainFromUrl(a.url || '') ? srcMap[domainFromUrl(a.url || '') as string] : null);
    const { error: covErr } = await supabase
      .from('event_source_coverage')
      .insert({ event_id: evt.id, source_id: coverageSourceId, headline: a.title, lean: 0, reason: 'Auto import', url: a.url, published_at: a.published_at });
    if (covErr) { errors.push(`create coverage failed: ${covErr.message}`); logs.push('coverage insert failed'); }

    // Create event_articles relationship if article was created
    if (articleId) {
      const { error: eaErr } = await supabase
        .from('event_articles')
        .insert({ event_id: evt.id, article_id: articleId, similarity: 0.9, stance_score: 0, lean_reason: 'Auto seeded' });
      if (eaErr) { errors.push(`create event_articles failed: ${eaErr.message}`); logs.push('event_articles insert failed'); }
      else { logs.push('event_articles created'); }
    }
    // Try Azure summarization using page text
    const pageText = a.url ? await fetchPageText(a.url) : null;
    const aiSummary = pageText ? await azureSummarize(pageText) : await azureSummarize(a.title);
    if (aiSummary) {
      logs.push('ai summary ok');
      await supabase
        .from('summaries')
        .update({ neutral_summary: aiSummary })
        .eq('event_id', evt.id)
        .eq('lang', 'en');
      // Localize to Sinhala and Tamil
      const si = await azureTranslate(aiSummary, 'si');
      if (si) {
        logs.push('ai si ok');
        await supabase
          .from('summaries')
          .upsert({ event_id: evt.id, lang: 'si', neutral_summary: si, neutral_detail: '', confidence: 50 });
      }
      const ta = await azureTranslate(aiSummary, 'ta');
      if (ta) {
        logs.push('ai ta ok');
        await supabase
          .from('summaries')
          .upsert({ event_id: evt.id, lang: 'ta', neutral_summary: ta, neutral_detail: '', confidence: 50 });
      }
    }
    created.push({ id: evt.id, title: evt.canonical_title });
  }
  if (!attempted) {
    logs.push('No articles and RSS likely blocked by environment.');
  }
  return NextResponse.json({ ok: true, attempted, created, errors, logs });
}
