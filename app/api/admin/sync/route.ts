import { NextResponse } from 'next/server';
// Defer heavy imports to inside handlers to avoid module-level errors causing 500 HTML responses
import { isAdminRequest } from '@/lib/auth';

/**
 * Manual AI Pipeline Sync Endpoint
 * POST /api/admin/sync
 * Allows admin to manually trigger the complete AI pipeline
 */
export async function POST(req: Request) {
  try {
    const { getServerSupabase } = await import('@/lib/supabaseServer');
    const supabase = getServerSupabase();
    console.log('🔄 Manual pipeline sync triggered...');

    // Unified admin auth
    if (!isAdminRequest(req)) {
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
        if (!res.ok) {
          ingestErrors++;
          ingestDetails.push({ sourceId: s.id, sourceName: s.name, created: 0, errors: [`HTTP ${res.status}`] });
          continue;
        }
        const ct = res.headers.get('content-type') || '';
        const json = ct.includes('application/json') ? await res.json() : { created: [], errors: [`invalid content-type: ${ct}`] };
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

    // Run complete pipeline (tolerant to failures)
    let results: any = null;
    let pipelineError: string | null = null;
    try {
      const { runCompletePipeline, logPipelineResults } = await import('@/lib/ai/pipeline');
      results = await runCompletePipeline();
      await logPipelineResults(results);
    } catch (e) {
      pipelineError = e instanceof Error ? e.message : String(e);
      console.error('Pipeline error (continuing response):', pipelineError);
    }

    return NextResponse.json({
      success: !pipelineError,
      message: pipelineError ? 'Pipeline encountered errors' : 'Pipeline sync completed successfully',
      error: pipelineError || undefined,
      results: results || undefined,
      timestamp: new Date().toISOString(),
      summary: {
        ingestion: {
          sourcesAttempted: ingestSourcesAttempted,
          eventsCreated: ingestCreated,
          errors: ingestErrors,
          amountPerSource,
          details: ingestDetails,
        },
        articlesEmbedded: results?.embeddings?.processed ?? 0,
        eventsCreated: results?.clustering?.eventsCreated ?? 0,
        summariesGenerated: results?.summarization?.summariesCreated ?? 0,
        biasAnalyzed: results?.bias?.articlesAnalyzed ?? 0,
        classified: results?.classification?.categoriesAssigned ?? 0,
        nonNewsFlagged: results?.classification?.nonNewsFlagged ?? 0,
        dedupMergedTitle: results?.dedupTitle?.merged ?? 0,
        dedupMergedVector: results?.dedupVector?.merged ?? 0,
        duration: results ? `${(results.duration / 1000).toFixed(2)}s` : 'N/A'
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
    const { getServerSupabase } = await import('@/lib/supabaseServer');
    const supabase = getServerSupabase();
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized - Invalid admin token' }, { status: 401 });
    }

    // Get latest pipeline runs
    let recentRuns: any[] = [];
    try {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);
      recentRuns = error ? [] : (data || []);
    } catch { recentRuns = []; }

    // Get current running status
    let runningPipeline: any = null;
    try {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('*')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      runningPipeline = error ? null : data;
    } catch { runningPipeline = null; }

    // Get pipeline stats
    let stats: any[] = [];
    try {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('status, duration_ms, embeddings_processed, events_created, summaries_generated, bias_analyzed')
        .order('started_at', { ascending: false })
        .limit(100);
      stats = error ? [] : (data || []);
    } catch { stats = []; }

    const summaryStats = {
      totalRuns: stats.length || 0,
      successfulRuns: stats.filter((r: any) => r.status === 'completed').length || 0,
      failedRuns: stats.filter((r: any) => r.status === 'failed').length || 0,
      avgDuration: stats.length > 0
        ? (stats.reduce((sum: number, r: any) => sum + (r.duration_ms || 0), 0) / stats.length / 1000).toFixed(1) + 's'
        : 'N/A',
      totalArticlesEmbedded: stats.reduce((sum: number, r: any) => sum + (r.embeddings_processed || 0), 0) || 0,
      totalEventsCreated: stats.reduce((sum: number, r: any) => sum + (r.events_created || 0), 0) || 0,
      totalSummariesGenerated: stats.reduce((sum: number, r: any) => sum + (r.summaries_generated || 0), 0) || 0,
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
