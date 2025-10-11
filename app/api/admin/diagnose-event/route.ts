import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { cosineSimilarity } from '../../../../lib/ai/embeddings';

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  const eventId = request.nextUrl.searchParams.get('eventId');

  if (!eventId) {
    // Find event by title keyword
    const keyword = request.nextUrl.searchParams.get('keyword') || 'Egg';
    const { data: events } = await supabase
      .from('events')
      .select('id, canonical_title')
      .ilike('canonical_title', `%${keyword}%`)
      .limit(5);

    return NextResponse.json({
      message: `Found ${events?.length || 0} events matching "${keyword}"`,
      events: events || [],
      usage: 'Use ?eventId=X or ?keyword=Y',
    });
  }

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Event not found' });
  }

  // Get all articles in this event
  const { data: eventArticles } = await supabase
    .from('event_articles')
    .select('article_id, similarity')
    .eq('event_id', eventId);

  const articleIds = (eventArticles || []).map((ea: any) => ea.article_id);

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, content_text, embedding, published_at')
    .in('id', articleIds);

  if (!articles || articles.length === 0) {
    return NextResponse.json({ error: 'No articles found for this event' });
  }

  // Calculate pairwise similarities
  const similarities = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const emb1 = typeof articles[i].embedding === 'string'
        ? JSON.parse(articles[i].embedding)
        : articles[i].embedding;
      const emb2 = typeof articles[j].embedding === 'string'
        ? JSON.parse(articles[j].embedding)
        : articles[j].embedding;

      const sim = cosineSimilarity(emb1, emb2);
      similarities.push({
        article1: articles[i].title.substring(0, 80),
        article2: articles[j].title.substring(0, 80),
        similarity: sim.toFixed(3),
      });
    }
  }

  // Get summaries
  const { data: summaries } = await supabase
    .from('summaries')
    .select('lang, neutral_summary')
    .eq('event_id', eventId);

  // Get coverage
  const { data: coverage } = await supabase
    .from('event_source_coverage')
    .select('*')
    .eq('event_id', eventId);

  // Analysis
  const avgSimilarity = similarities.length > 0
    ? similarities.reduce((sum, s) => sum + parseFloat(s.similarity), 0) / similarities.length
    : 0;

  const minSimilarity = similarities.length > 0
    ? Math.min(...similarities.map(s => parseFloat(s.similarity)))
    : 0;

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.canonical_title,
      category: event.category,
      updatedAt: event.last_updated_at,
    },
    articles: articles.map(a => ({
      id: a.id,
      title: a.title,
      contentPreview: a.content_text?.substring(0, 150) || 'N/A',
      publishedAt: a.published_at,
    })),
    summaries: summaries?.map(s => ({
      lang: s.lang,
      preview: s.neutral_summary?.substring(0, 200),
    })),
    coverage: coverage?.map(c => ({
      headline: c.headline,
      lean: c.lean,
    })),
    analysis: {
      articleCount: articles.length,
      avgSimilarity: avgSimilarity.toFixed(3),
      minSimilarity: minSimilarity.toFixed(3),
      pairwiseSimilarities: similarities,
      currentThreshold: 0.88,
      problem: minSimilarity < 0.88 ? 'Articles may be unrelated (below clustering threshold)' : null,
      recommendation: minSimilarity < 0.88
        ? `Some articles have similarity ${minSimilarity.toFixed(3)} below threshold 0.88. Consider re-clustering or increasing threshold to 0.90+`
        : 'Clustering quality good - all articles meet threshold',
    },
  });
}
