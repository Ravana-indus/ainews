import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

type PipelineRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  error_message: string | null;
};

export async function GET() {
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Get stories count and recent stories
  const [{ count: storiesCount }, recentStoriesRes] = await Promise.all([
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('id, published_at').gte('published_at', since),
  ]);

  const stories24h = (recentStoriesRes.data || []).length;
  const avgConfidence = 75; // Default confidence

  // Get pipeline runs if table exists (optional)
  let runs: PipelineRun[] = [];
  try {
    const { data: runsRes } = await supabase
      .from('pipeline_runs')
      .select('id, started_at, finished_at, status, error_message')
      .order('started_at', { ascending: false })
      .limit(10);
    runs = runsRes || [];
  } catch (e) {
    // pipeline_runs table might not exist, ignore error
    console.log('pipeline_runs table not found, skipping');
  }

  return NextResponse.json({
    articles24h: stories24h,
    eventsCreated: storiesCount || 0,
    summariesGenerated: storiesCount || 0,
    avgConfidence,
    runs,
  });
}
