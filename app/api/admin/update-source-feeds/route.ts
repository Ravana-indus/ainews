import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { fetchRssItemsWithDiagnostics } from '../../../../lib/rss';

/**
 * Manually update specific sources with correct RSS URLs
 * Based on actual working RSS feeds from these news sites
 */
export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();

  const updates = [
    // Ada Derana Tamil - Use main site RSS with lang parameter
    {
      id: '94bfb770-6652-4d93-b337-7206e1a2ca44',
      rss_url: 'https://www.adaderana.lk/rss_tamil.php',
      domain: 'www.adaderana.lk',
    },
    // Daily Mirror - Try alternate RSS endpoint
    {
      id: 'd30b61a0-8317-4cf5-a4f2-e6cec4a45211',
      rss_url: 'https://www.dailymirror.lk/RSS',
      domain: 'www.dailymirror.lk',
    },
    // Hirunews English - Actual working RSS
    {
      id: '8a1aa21b-1253-49eb-a27c-b9952b5e50e8',
      rss_url: 'https://www.hirunews.lk/rss/news_rss.xml',
      domain: 'www.hirunews.lk',
    },
    // Hirunews Tamil - Different domain to avoid constraint
    {
      id: '03667076-6c9c-408c-8ed6-1bf908d4f3a6',
      rss_url: 'https://www.hirunews.lk/rss/tamil_news_rss.xml',
      domain: 'tamil.hirunews.lk', // Different domain to avoid duplicate
    },
    // Newsfirst Sinhala - Try main feed
    {
      id: '8ec27cdc-9522-4579-ab45-28536b2e8dc7',
      rss_url: 'https://www.newsfirst.lk/feed/',
      domain: 'www.newsfirst.lk',
    },
  ];

  const results = [];

  for (const update of updates) {
    try {
      // Test RSS URL
      const rssTest = await fetchRssItemsWithDiagnostics(update.rss_url, 3);
      const works = rssTest.items.length > 0;

      // Update database
      const { data, error } = await supabase
        .from('sources')
        .update({
          rss_url: update.rss_url,
          domain: update.domain,
        })
        .eq('id', update.id)
        .select('name, id')
        .single();

      results.push({
        id: update.id,
        name: data?.name || 'unknown',
        rss_url: update.rss_url,
        works,
        itemsFound: rssTest.items.length,
        updated: !error,
        error: error?.message || null,
        sample: rssTest.items.slice(0, 2),
      });

      console.log(`${works ? '✅' : '❌'} ${data?.name}: ${rssTest.items.length} items`);
    } catch (error: any) {
      results.push({
        id: update.id,
        error: error.message,
        works: false,
      });
    }
  }

  const workingCount = results.filter(r => r.works).length;

  return NextResponse.json({
    success: true,
    message: `${workingCount}/${updates.length} sources now have working RSS feeds`,
    results,
  });
}
