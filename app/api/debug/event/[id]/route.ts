import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../../lib/supabaseServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getServerSupabase();
  const eventId = params.id;

  // Check event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  // Check summaries
  const { data: summaries } = await supabase
    .from('summaries')
    .select('*')
    .eq('event_id', eventId);

  // Check coverage
  const { data: coverage } = await supabase
    .from('event_source_coverage')
    .select('*')
    .eq('event_id', eventId);

  // Check linked articles
  const { data: eventArticles } = await supabase
    .from('event_articles')
    .select('article_id')
    .eq('event_id', eventId);

  const articleIds = (eventArticles || []).map((ea: any) => ea.article_id);
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, content_text, url, source_id, published_at')
    .in('id', articleIds);

  return NextResponse.json({
    event,
    summaries: summaries || [],
    coverage: coverage || [],
    articles: articles || [],
    diagnostics: {
      hasSummaries: (summaries || []).length > 0,
      hasCoverage: (coverage || []).length > 0,
      hasArticles: (articles || []).length > 0,
      summaryCount: (summaries || []).length,
      coverageCount: (coverage || []).length,
      articleCount: (articles || []).length,
    }
  });
}
