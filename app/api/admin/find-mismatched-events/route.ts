import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';

/**
 * Find events where the title doesn't match the summary content
 * This indicates clustering or summarization problems
 */
export async function GET() {
  const supabase = getServerSupabase();

  // Get recent events with summaries
  const { data: events } = await supabase
    .from('events')
    .select('id, canonical_title, last_updated_at')
    .eq('is_news', true)
    .order('last_updated_at', { ascending: false })
    .limit(20);

  if (!events) {
    return NextResponse.json({ error: 'No events found' });
  }

  const mismatches = [];

  for (const event of events) {
    // Get summary
    const { data: summaries } = await supabase
      .from('summaries')
      .select('lang, neutral_summary')
      .eq('event_id', event.id)
      .eq('lang', 'en')
      .single();

    // Get articles
    const { data: eventArticles } = await supabase
      .from('event_articles')
      .select('article_id')
      .eq('event_id', event.id);

    const articleIds = (eventArticles || []).map((ea: any) => ea.article_id);

    const { data: articles } = await supabase
      .from('articles')
      .select('id, title')
      .in('id', articleIds);

    // Check if title matches summary
    const title = event.canonical_title.toLowerCase();
    const summary = summaries?.neutral_summary?.toLowerCase() || '';
    const articleTitles = (articles || []).map((a: any) => a.title.toLowerCase());

    // Extract key terms from title
    const titleWords = title.split(/\s+/).filter((w: string) => w.length > 4);
    const summaryHasKeyWords = titleWords.some((word: string) => summary.includes(word));
    const articlesMatchTitle = articleTitles.some((artTitle: string) =>
      titleWords.some((word: string) => artTitle.includes(word))
    );

    if (!summaryHasKeyWords || !articlesMatchTitle) {
      mismatches.push({
        eventId: event.id,
        title: event.canonical_title,
        summaryPreview: summaries?.neutral_summary?.substring(0, 150) || 'N/A',
        articleTitles: articleTitles.slice(0, 3),
        titleMatchesSummary: summaryHasKeyWords,
        titleMatchesArticles: articlesMatchTitle,
        updatedAt: event.last_updated_at,
      });
    }
  }

  return NextResponse.json({
    total: events.length,
    mismatched: mismatches.length,
    events: mismatches,
  });
}
