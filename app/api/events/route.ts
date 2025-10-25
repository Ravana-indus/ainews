import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { extractSummary, getSourceNameFromUrl } from '@/lib/utils';

export async function GET() {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (stories || []).map((story: any) => {
    // Parse bias_analysis if available
    let biasSummary: any[] = [];
    let sources: any[] = [];

    if (story.bias_analysis) {
      try {
        // Parse bias_analysis (currently unused, reserved for future enhancement)
        typeof story.bias_analysis === 'string'
          ? JSON.parse(story.bias_analysis)
          : story.bias_analysis;

        biasSummary = [{
          sourceId: 'bias_analysis',
          score: 0,
          label: 'Neutral 0'
        }];
      } catch (e) {
        console.error('Error parsing bias_analysis:', e);
      }
    }

    // Create source info from source_url
    if (story.source_url) {
      const urls = story.source_url.split(',').map((url: string) => url.trim());
      sources = urls.map((url: string, index: number) => ({
        sourceId: `source_${index}`,
        sourceName: getSourceNameFromUrl(url),
        sourceLogo: null,
        headline: story.title || 'No title',
        lean: 0,
        reason: 'Source coverage',
        url: url.trim(),
        publishedAt: story.published_at,
      }));
    }

    return {
      id: story.id,
      title: story.title || 'Untitled Story',
      summary: {
        en: extractSummary(story.detailed_content || ''),
        si: extractSummary(story.detailed_content || ''),
        ta: extractSummary(story.detailed_content || '')
      },
      detail: {
        en: story.detailed_content || '',
        si: story.detailed_content || '',
        ta: story.detailed_content || ''
      },
      updatedAt: story.published_at,
      confidence: 75,
      category: story.category || 'General',
      sources: sources.slice(0, 4),
      biasSummary: biasSummary,
    };
  });

  return NextResponse.json({ events: result });
}
