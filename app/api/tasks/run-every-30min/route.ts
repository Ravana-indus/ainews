import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { runCompletePipeline, logPipelineResults } from '@/lib/ai/pipeline';

/**
 * Automated Pipeline - Runs every 30 minutes
 *
 * Vercel Cron: Configured in vercel.json to run every 30 minutes
 * Manual trigger: curl -X GET http://localhost:3000/api/tasks/run-every-30min -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
 */

async function runPipeline() {
  console.log('🌊 Starting 30-minute pipeline...');

  // Record pipeline start
  const { data: runStart, error: startError } = await supabase
    .from('pipeline_runs')
    .insert({
      status: 'running',
      trigger: 'automated-30min'
    })
    .select()
    .single();

  if (startError || !runStart) {
    console.error('Failed to start pipeline run:', startError);
    throw startError;
  }

  const runId = runStart.id;

  try {
    // Run complete AI pipeline (with increased 10 articles per source)
    const results = await runCompletePipeline();

    // Log results to database
    await logPipelineResults(results);

    // Mark run as completed
    await supabase
      .from('pipeline_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', runId);

    console.log(`✅ Pipeline ${runId} completed successfully`);
    console.log(`📊 Results: ${results.clustering.eventsCreated} events created from ${results.clustering.articlesProcessed} articles`);

    return results;

  } catch (error) {
    console.error('❌ Pipeline failed:', error);

    // Mark run as failed
    await supabase
      .from('pipeline_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', runId);

    throw error;
  }
}

export async function GET(req: Request) {
  // Validate Vercel cron header in production
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-vercel-cron');

  // In production, validate cron header or admin token
  if (process.env.NODE_ENV === 'production') {
    if (cronHeader !== '1' && authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return NextResponse.json({
        error: 'Forbidden - Invalid cron header or admin token'
      }, { status: 403 });
    }
  }

  // In development, allow admin token
  if (process.env.NODE_ENV === 'development' && authHeader) {
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const results = await runPipeline();
    return NextResponse.json({
      ok: true,
      results,
      schedule: 'Every 30 minutes',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Pipeline execution failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Pipeline execution failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
