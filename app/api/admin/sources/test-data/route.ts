import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { isAdminRequest } from '@/lib/auth';

/**
 * Test Data Seeder - Add sample Sri Lankan news sources
 * POST /api/admin/sources/test-data
 */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sampleSources = [
    {
      name: 'Daily News Sri Lanka',
      domain: 'dailynews.lk',
      language: 'en',
      reliability: 0.85,
      rss_url: 'https://www.dailynews.lk/feed',
      logo_url: 'https://www.dailynews.lk/wp-content/uploads/2021/08/cropped-daily-news-favicon-32x32.png',
      enabled: true
    },
    {
      name: 'Ada Derana',
      domain: 'adaderana.lk',
      language: 'si',
      reliability: 0.88,
      rss_url: 'https://www.adaderana.lk/rss.xml',
      logo_url: 'https://www.adaderana.lk/common/images/adaderana-logo.png',
      enabled: true
    },
    {
      name: 'NewsFirst',
      domain: 'newsfirst.lk',
      language: 'en',
      reliability: 0.82,
      rss_url: 'https://www.newsfirst.lk/feed',
      logo_url: 'https://www.newsfirst.lk/wp-content/themes/newsfirst/assets/images/logo.png',
      enabled: true
    },
    {
      name: 'Hiru News',
      domain: 'hirunews.lk',
      language: 'si',
      reliability: 0.80,
      rss_url: 'https://www.hirunews.lk/rss/sinhala.xml',
      logo_url: 'https://www.hirunews.lk/images/hirunews-logo.png',
      enabled: true
    },
    {
      name: 'Tamil Guardian',
      domain: 'tamilguardian.com',
      language: 'ta',
      reliability: 0.90,
      rss_url: 'https://www.tamilguardian.com/feed',
      logo_url: 'https://www.tamilguardian.com/wp-content/uploads/2021/07/favicon.png',
      enabled: true
    }
  ];

  const results = { added: 0, existing: 0, errors: [] as string[] };

  for (const source of sampleSources) {
    try {
      // Check if source already exists
      const { data: existing } = await supabase
        .from('sources')
        .select('id')
        .eq('domain', source.domain)
        .maybeSingle();

      if (existing) {
        results.existing++;
        continue;
      }

      // Add new source
      const { data, error } = await supabase
        .from('sources')
        .insert(source)
        .select()
        .single();

      if (error) {
        results.errors.push(`Failed to add ${source.name}: ${error.message}`);
      } else {
        results.added++;
        console.log(`Added source: ${source.name}`);
      }
    } catch (err) {
      results.errors.push(`Error adding ${source.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json({
    success: true,
    results,
    message: `Added ${results.added} new sources, ${results.existing} already existed, ${results.errors.length} errors`
  });
}