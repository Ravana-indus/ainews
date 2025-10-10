import { NextResponse } from 'next/server';
import { runCompletePipeline, logPipelineResults } from '@/lib/ai/pipeline';
import { getServerSupabase } from '@/lib/supabaseServer';

/**
 * Manual AI Pipeline Sync Endpoint
 * POST /api/admin/sync
 * Allows admin to manually trigger the complete AI pipeline
 */
export async function POST(req: Request) {
  try {
    const supabase = getServerSupabase();
    console.log('🔄 Manual pipeline sync triggered...');

    // Admin auth: allow Bearer token or x-admin-token/cookie
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.replace('Bearer ', '') || '';
    const xAdminToken = req.headers.get('x-admin-token') || '';
    const cookieToken = (req.headers.get('cookie') || '').includes(`admin_token=${process.env.ADMIN_TOKEN}`);
    const ok = (bearerToken && bearerToken === process.env.ADMIN_TOKEN) || (xAdminToken && xAdminToken === process.env.ADMIN_TOKEN) || cookieToken;
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized - Invalid admin token' }, { status: 401 });
    }

    // Read options
    let amountPerSource = 5;
    try {
      const body = await req.json();
      if (body && typeof body.amount === 'number') {
        amountPerSource = Math.max(1, Math.min(20, Number(body.amount)));
      }
    } catch {}

    // Check if there's already a pipeline running
    const { data: runningPipeline } = await supabase
      .from('pipeline_runs')
      .select('id, started_at')
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runningPipeline) {
      return NextResponse.json({
        success: false,
        message: 'Pipeline already running',
        runningSince: runningPipeline.started_at,
        canRunAgain: false,
      });
    }

    // Step A: Ingest for all enabled sources (RSS or scrape fallback)
    const { data: sources } = await supabase
      .from('sources')
      .select('id, name, domain, enabled')
      .eq('enabled', true)
      .order('name', { ascending: true });

    const origin = new URL(req.url).origin;
    let ingestCreated = 0;
    let ingestErrors = 0;
    let ingestSourcesAttempted = 0;
    const ingestDetails: Array<{ sourceId: string; sourceName: string; created: number; errors: string[] }> = [];
    for (const s of (sources || [])) {
      ingestSourcesAttempted++;
      try {
        const res = await fetch(`${origin}/api/admin/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': process.env.ADMIN_TOKEN || '' },
          body: JSON.stringify({ amount: amountPerSource, sourceId: s.id })
        });
        const json = await res.json();
        const createdCount = (json.created || []).length || 0;
        const errorsArr = (json.errors || []) as string[];
        ingestCreated += createdCount;
        ingestErrors += errorsArr.length || 0;
        ingestDetails.push({ sourceId: s.id, sourceName: s.name, created: createdCount, errors: errorsArr || [] });
      } catch (err) {
        ingestErrors++;
        ingestDetails.push({ sourceId: s.id, sourceName: s.name, created: 0, errors: [err instanceof Error ? err.message : 'ingest failed'] });
      }
      // small delay to reduce rate spikes
      await new Promise(r => setTimeout(r, 200));
    }

    // Run complete pipeline
    const results = await runCompletePipeline();

    // Log results
    await logPipelineResults(results);

    return NextResponse.json({
      success: true,
      message: 'Pipeline sync completed successfully',
      results,
      timestamp: new Date().toISOString(),
      summary: {
        ingestion: {
          sourcesAttempted: ingestSourcesAttempted,
          eventsCreated: ingestCreated,
          errors: ingestErrors,
          amountPerSource,
          details: ingestDetails,
        },
        articlesEmbedded: results.embeddings.processed,
        eventsCreated: results.clustering.eventsCreated,
        summariesGenerated: results.summarization.summariesCreated,
        biasAnalyzed: results.bias.articlesAnalyzed,
        duration: `${(results.duration / 1000).toFixed(2)}s`
      }
    });

  } catch (error) {
    console.error('❌ Manual pipeline sync failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Pipeline sync failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * Get pipeline status
 * GET /api/admin/sync
 */
export async function GET(req: Request) {
  try {
    const supabase = getServerSupabase();
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.replace('Bearer ', '') || '';
    const xAdminToken = req.headers.get('x-admin-token') || '';
    const cookieToken = (req.headers.get('cookie') || '').includes(`admin_token=${process.env.ADMIN_TOKEN}`);
    const ok = (bearerToken && bearerToken === process.env.ADMIN_TOKEN) || (xAdminToken && xAdminToken === process.env.ADMIN_TOKEN) || cookieToken;
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized - Invalid admin token' }, { status: 401 });
    }

    // Get latest pipeline runs
    const { data: recentRuns } = await supabase
      .from('pipeline_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);

    // Get current running status
    const { data: runningPipeline } = await supabase
      .from('pipeline_runs')
      .select('*')
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get pipeline stats
    const { data: stats } = await supabase
      .from('pipeline_runs')
      .select('status, duration_ms, embeddings_processed, events_created, summaries_generated, bias_analyzed')
      .order('started_at', { ascending: false })
      .limit(100);

    const summaryStats = {
      totalRuns: stats?.length || 0,
      successfulRuns: stats?.filter(r => r.status === 'completed').length || 0,
      failedRuns: stats?.filter(r => r.status === 'failed').length || 0,
      avgDuration: stats && stats.length > 0
        ? (stats.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / stats.length / 1000).toFixed(1) + 's'
        : 'N/A',
      totalArticlesEmbedded: stats?.reduce((sum, r) => sum + (r.embeddings_processed || 0), 0) || 0,
      totalEventsCreated: stats?.reduce((sum, r) => sum + (r.events_created || 0), 0) || 0,
      totalSummariesGenerated: stats?.reduce((sum, r) => sum + (r.summaries_generated || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      isRunning: !!runningPipeline,
      runningSince: runningPipeline?.started_at || null,
      recentRuns: recentRuns || [],
      stats: summaryStats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to get pipeline status:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pipeline status',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
