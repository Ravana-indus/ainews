import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { fetchRssItemsWithDiagnostics } from '../../../../lib/rss';
import { fetchLatestLinksFromDomain } from '../../../../lib/scraper';

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  const sourceId = request.nextUrl.searchParams.get('sourceId');

  if (!sourceId) {
    return NextResponse.json({ error: 'sourceId required' }, { status: 400 });
  }

  // Get source details
  const { data: source, error: sourceError } = await supabase
    .from('sources')
    .select('*')
    .eq('id', sourceId)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  const diagnostics: any = {
    source: {
      id: source.id,
      name: source.name,
      domain: source.domain,
      rss_url: source.rss_url,
      language: source.language,
      enabled: source.enabled,
    },
    tests: {},
  };

  // Test 1: RSS Feed (if available)
  if (source.rss_url) {
    try {
      const rssResult = await fetchRssItemsWithDiagnostics(source.rss_url, 5);
      diagnostics.tests.rss = {
        success: rssResult.items.length > 0,
        itemsFound: rssResult.items.length,
        items: rssResult.items,
        logs: rssResult.logs,
        errors: rssResult.errors,
      };
    } catch (error: any) {
      diagnostics.tests.rss = {
        success: false,
        error: error.message,
      };
    }
  } else {
    diagnostics.tests.rss = {
      success: false,
      error: 'No RSS URL configured',
    };
  }

  // Test 2: Domain Scraping (fallback)
  if (source.domain) {
    try {
      const scrapeResult = await fetchLatestLinksFromDomain(source.domain, 5);
      diagnostics.tests.scraping = {
        success: scrapeResult.items.length > 0,
        itemsFound: scrapeResult.items.length,
        items: scrapeResult.items,
        logs: scrapeResult.logs,
        errors: scrapeResult.errors,
      };
    } catch (error: any) {
      diagnostics.tests.scraping = {
        success: false,
        error: error.message,
      };
    }
  } else {
    diagnostics.tests.scraping = {
      success: false,
      error: 'No domain configured',
    };
  }

  // Recommendation
  const rssWorks = diagnostics.tests.rss?.success;
  const scrapingWorks = diagnostics.tests.scraping?.success;

  diagnostics.recommendation = rssWorks
    ? 'RSS feed is working correctly'
    : scrapingWorks
    ? 'RSS feed failed but scraping works - consider updating RSS URL'
    : 'Both RSS and scraping failed - source needs manual review';

  diagnostics.shouldEnable = rssWorks || scrapingWorks;

  return NextResponse.json(diagnostics);
}
