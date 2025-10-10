import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { runCompletePipeline, logPipelineResults } from '@/lib/ai/pipeline';

async function runPipeline() {
  console.log('🌊 Starting hourly pipeline...');

  // Record pipeline start
  const { data: runStart, error: startError } = await supabase
    .from('pipeline_runs')
    .insert({ status: 'running' })
    .select()
    .single();

  if (startError || !runStart) {
    console.error('Failed to start pipeline run:', startError);
    throw startError;
  }

  const runId = runStart.id;

  try {
    // Run complete AI pipeline
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

  // In production, validate cron header
  if (process.env.NODE_ENV === 'production' && cronHeader !== '1') {
    return NextResponse.json({ error: 'Forbidden - Invalid cron header' }, { status: 403 });
  }

  // Optional admin token validation
  if (authHeader && authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runPipeline();
    return NextResponse.json({
      ok: true,
      results,
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

