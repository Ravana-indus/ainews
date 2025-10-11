import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { summarizeEventInAllLanguages, saveSummaries } from '../../../../lib/ai/summarize';
import { detectBiasForEvent } from '../../../../lib/ai/bias';

export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();

  try {
    // Find events without summaries
    const { data: events } = await supabase
      .from('events')
      .select('id, canonical_title')
      .order('last_updated_at', { ascending: false })
      .limit(50);

    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No events found' });
    }

    // Check which events have summaries
    const eventIds = events.map((e: any) => e.id);
    const { data: existingSummaries } = await supabase
      .from('summaries')
      .select('event_id')
      .in('event_id', eventIds);

    const eventsWithSummaries = new Set(
      (existingSummaries || []).map((s: any) => s.event_id)
    );

    const eventsToProcess = events.filter(
      (e: any) => !eventsWithSummaries.has(e.id)
    );

    console.log(`Found ${eventsToProcess.length} events needing reprocessing`);

    let processed = 0;
    let failed = 0;
    const results = [];

    for (const event of eventsToProcess) {
      try {
        console.log(`\nProcessing event ${event.id}: ${event.canonical_title}`);

        // Step 1: Recreate coverage from event_articles
        const { data: eventArticles } = await supabase
          .from('event_articles')
          .select('article_id')
          .eq('event_id', event.id);

        const articleIds = (eventArticles || []).map((ea: any) => ea.article_id);

        if (articleIds.length === 0) {
          console.log(`⚠️ No articles for event ${event.id}`);
          failed++;
          continue;
        }

        const { data: articles } = await supabase
          .from('articles')
          .select('id, title, source_id, url, published_at')
          .in('id', articleIds);

        if (!articles || articles.length === 0) {
          console.log(`⚠️ Articles not found for event ${event.id}`);
          failed++;
          continue;
        }

        // Create coverage
        const coverages = articles.map((article: any) => ({
          event_id: event.id,
          source_id: article.source_id,
          headline: article.title,
          url: article.url,
          published_at: article.published_at,
          lean: 0,
          reason: '',
        }));

        await supabase
          .from('event_source_coverage')
          .upsert(coverages, {
            onConflict: 'event_id,source_id',
            ignoreDuplicates: false
          });

        // Step 2: Generate summaries
        const summaries = await summarizeEventInAllLanguages(event.id);

        if (summaries) {
          await saveSummaries(event.id, summaries);
          console.log(`✅ Summaries created`);
        }

        // Step 3: Detect bias
        const biasResult = await detectBiasForEvent(event.id);
        console.log(`✅ Bias detection: ${biasResult.analyzed} analyzed`);

        processed++;
        results.push({
          eventId: event.id,
          title: event.canonical_title,
          status: 'success',
          articleCount: articles.length,
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`❌ Failed to process event ${event.id}:`, error);
        failed++;
        results.push({
          eventId: event.id,
          title: event.canonical_title,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalEvents: events.length,
      eventsNeedingReprocessing: eventsToProcess.length,
      processed,
      failed,
      results,
    });

  } catch (error: any) {
    console.error('Failed to reprocess events:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
