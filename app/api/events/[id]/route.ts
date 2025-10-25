import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { extractSummary, getSourceNameFromUrl } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

  const result = {
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
    sources,
    biasSummary,
  };

  return NextResponse.json(result);
}
