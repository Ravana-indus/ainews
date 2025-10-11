import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { summarizeEventInAllLanguages, saveSummaries } from '../../../../lib/ai/summarize';
import { detectBiasForEvent } from '../../../../lib/ai/bias';

export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();
  const body = await request.json();
  const eventId = body.eventId;

  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  try {
    // Step 1: Recreate event_source_coverage from event_articles
    const { data: eventArticles } = await supabase
      .from('event_articles')
      .select('article_id')
      .eq('event_id', eventId);

    const articleIds = (eventArticles || []).map((ea: any) => ea.article_id);

    if (articleIds.length === 0) {
      return NextResponse.json({
        error: 'No articles linked to this event',
        eventId
      }, { status: 400 });
    }

    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, source_id, url, published_at')
      .in('id', articleIds);

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        error: 'No articles found',
        eventId
      }, { status: 400 });
    }

    // Create coverage entries with upsert
    const coverages = articles.map((article: any) => ({
      event_id: eventId,
      source_id: article.source_id,
      headline: article.title,
      url: article.url,
      published_at: article.published_at,
      lean: 0,
      reason: '',
    }));

    const { error: coverageError } = await supabase
      .from('event_source_coverage')
      .upsert(coverages, {
        onConflict: 'event_id,source_id',
        ignoreDuplicates: false
      });

    if (coverageError) {
      console.error('Failed to create coverage:', coverageError);
    }

    // Step 2: Generate summaries
    console.log(`Generating summaries for event ${eventId}...`);
    let summariesCreated = 0;
    try {
      const summaries = await summarizeEventInAllLanguages(eventId);

      if (summaries) {
        await saveSummaries(eventId, summaries);
        summariesCreated = 3;
        console.log(`✅ Summaries created for event ${eventId}`);
        console.log(`   EN: ${summaries.en.neutral_summary.substring(0, 100)}...`);
      } else {
        console.warn(`⚠️ summarizeEventInAllLanguages returned null for event ${eventId}`);
      }
    } catch (summaryError: any) {
      console.error(`❌ Summarization failed for event ${eventId}:`, summaryError.message);
    }

    // Step 3: Detect bias
    console.log(`Detecting bias for event ${eventId}...`);
    let biasResult = { analyzed: 0, failed: 0 };
    try {
      biasResult = await detectBiasForEvent(eventId);
      console.log(`✅ Bias detection complete for event ${eventId}:`, biasResult);
    } catch (biasError: any) {
      console.error(`❌ Bias detection failed for event ${eventId}:`, biasError.message);
    }

    return NextResponse.json({
      success: true,
      eventId,
      articleCount: articles.length,
      coverageCreated: coverages.length,
      summariesCreated,
      biasAnalyzed: biasResult.analyzed,
      message: 'Event reprocessing attempted (check logs for details)'
    });

  } catch (error: any) {
    console.error('Failed to reprocess event:', error);
    return NextResponse.json({
      error: error.message,
      eventId
    }, { status: 500 });
  }
}
