import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';

/**
 * Manually create event_source_coverage entries for events that are missing them
 * This fixes events created before the upsert fix was applied
 */
export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();
  const body = await request.json();
  const eventId = body.eventId;

  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  try {
    // Step 1: Get articles linked to this event
    const { data: eventArticles, error: eaError } = await supabase
      .from('event_articles')
      .select('article_id')
      .eq('event_id', eventId);

    if (eaError || !eventArticles || eventArticles.length === 0) {
      return NextResponse.json({
        error: 'No articles linked to this event',
        eventId,
      }, { status: 400 });
    }

    const articleIds = eventArticles.map((ea: any) => ea.article_id);

    // Step 2: Get article details
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, source_id, url, published_at')
      .in('id', articleIds);

    if (articlesError || !articles || articles.length === 0) {
      return NextResponse.json({
        error: 'No articles found',
        eventId,
      }, { status: 400 });
    }

    // Step 3: Check existing coverage
    const { data: existingCoverage } = await supabase
      .from('event_source_coverage')
      .select('event_id, source_id')
      .eq('event_id', eventId);

    const existingKeys = new Set(
      (existingCoverage || []).map((c: any) => `${c.event_id}-${c.source_id}`)
    );

    // Step 4: Deduplicate by source_id (keep only one article per source)
    // Use a Map to keep the most recent article per source
    const articlesBySource = new Map<string, any>();
    for (const article of articles) {
      const existing = articlesBySource.get(article.source_id);
      if (!existing || new Date(article.published_at) > new Date(existing.published_at)) {
        articlesBySource.set(article.source_id, article);
      }
    }

    // Step 5: Create coverage entries (only for missing ones)
    const coveragesToCreate = Array.from(articlesBySource.values())
      .filter(article => !existingKeys.has(`${eventId}-${article.source_id}`))
      .map(article => ({
        event_id: eventId,
        source_id: article.source_id,
        headline: article.title,
        url: article.url,
        published_at: article.published_at,
        lean: 0,
        reason: 'Auto-created via fix-coverage endpoint',
      }));

    if (coveragesToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All coverage already exists',
        eventId,
        existingCount: existingCoverage?.length || 0,
        articlesCount: articles.length,
      });
    }

    // Step 6: Insert coverage with upsert
    const { data: insertedCoverage, error: insertError } = await supabase
      .from('event_source_coverage')
      .upsert(coveragesToCreate, {
        onConflict: 'event_id,source_id',
        ignoreDuplicates: false,
      })
      .select();

    if (insertError) {
      console.error('Failed to create coverage:', insertError);
      return NextResponse.json({
        error: insertError.message,
        eventId,
      }, { status: 500 });
    }

    // Step 7: Verify coverage was created
    const { data: finalCoverage } = await supabase
      .from('event_source_coverage')
      .select('*')
      .eq('event_id', eventId);

    return NextResponse.json({
      success: true,
      eventId,
      articlesCount: articles.length,
      coverageCreated: coveragesToCreate.length,
      existingCount: existingCoverage?.length || 0,
      finalCount: finalCoverage?.length || 0,
      message: `Created ${coveragesToCreate.length} coverage entries`,
      coverage: finalCoverage,
    });

  } catch (error: any) {
    console.error('Failed to fix coverage:', error);
    return NextResponse.json({
      error: error.message,
      eventId,
    }, { status: 500 });
  }
}
