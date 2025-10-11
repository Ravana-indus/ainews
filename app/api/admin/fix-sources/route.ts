import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { fetchRssItemsWithDiagnostics } from '../../../../lib/rss';

/**
 * Fix sources by adding correct RSS URLs
 */
export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();

  // RSS URLs for failing sources (researched manually)
  const rssUpdates = [
    {
      name: 'Ada Derana English',
      rss_url: 'https://www.adaderana.lk/rss.php',
      domain: 'www.adaderana.lk',
    },
    {
      name: 'Ada Derana Tamil',
      rss_url: 'https://tamil.adaderana.lk/rss.php',
      domain: 'tamil.adaderana.lk',
    },
    {
      name: 'Daily Mirror',
      rss_url: 'https://www.dailymirror.lk/feed',
      domain: 'www.dailymirror.lk',
    },
    {
      name: 'Hirunews English',
      rss_url: 'https://www.hirunews.lk/english/rss.xml',
      domain: 'www.hirunews.lk',
    },
    {
      name: 'Hirunews Tamil',
      rss_url: 'https://www.hirunews.lk/tamil/rss.xml',
      domain: 'www.hirunews.lk',
    },
    {
      name: 'Newsfirst Sinhala',
      rss_url: 'https://www.newsfirst.lk/sinhala/feed/',
      domain: 'www.newsfirst.lk',
    },
  ];

  const results = [];

  for (const update of rssUpdates) {
    try {
      // Test RSS URL first
      const rssTest = await fetchRssItemsWithDiagnostics(update.rss_url, 3);
      const rssWorks = rssTest.items.length > 0;

      // Update source in database
      const { data, error } = await supabase
        .from('sources')
        .update({
          rss_url: update.rss_url,
          domain: update.domain,
        })
        .eq('name', update.name)
        .select()
        .single();

      results.push({
        name: update.name,
        success: !error,
        rssWorks,
        itemsFound: rssTest.items.length,
        updated: !!data,
        error: error?.message || null,
        rssLogs: rssTest.logs,
        rssErrors: rssTest.errors,
      });

      console.log(`✅ Updated ${update.name}: RSS ${rssWorks ? 'works' : 'failed'} (${rssTest.items.length} items)`);
    } catch (error: any) {
      results.push({
        name: update.name,
        success: false,
        error: error.message,
      });
      console.error(`❌ Failed to update ${update.name}:`, error.message);
    }
  }

  const successCount = results.filter(r => r.success && r.rssWorks).length;

  return NextResponse.json({
    success: true,
    message: `Updated ${successCount}/${rssUpdates.length} sources with working RSS feeds`,
    results,
  });
}

/**
 * Test all sources
 */
export async function GET() {
  const supabase = getServerSupabase();

  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('enabled', true)
    .order('name');

  const results = [];

  for (const source of sources || []) {
    let rssStatus = 'no-rss';
    let itemsFound = 0;

    if (source.rss_url) {
      try {
        const rssTest = await fetchRssItemsWithDiagnostics(source.rss_url, 3);
        rssStatus = rssTest.items.length > 0 ? 'working' : 'broken';
        itemsFound = rssTest.items.length;
      } catch {
        rssStatus = 'error';
      }
    }

    results.push({
      name: source.name,
      language: source.language,
      rssStatus,
      itemsFound,
      hasRss: !!source.rss_url,
    });
  }

  const summary = {
    total: results.length,
    working: results.filter(r => r.rssStatus === 'working').length,
    broken: results.filter(r => r.rssStatus === 'broken').length,
    noRss: results.filter(r => r.rssStatus === 'no-rss').length,
    error: results.filter(r => r.rssStatus === 'error').length,
  };

  return NextResponse.json({
    summary,
    sources: results,
  });
}
