import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const [{ count: eventsCount }, { count: summariesCount }, articlesRes, confsRes, runsRes] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('summaries').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('id, published_at').gte('published_at', since),
    supabase.from('summaries').select('confidence'),
    supabase.from('pipeline_runs').select('id, started_at, finished_at, status, error_message').order('started_at', { ascending: false }).limit(10),
  ]);

  const articles24h = (articlesRes.data || []).length;
  const confs = (confsRes.data || []) as any[];
  const avgConfidence = confs.length ? Math.round(confs.reduce((a, c) => a + Number(c.confidence || 0), 0) / confs.length) : 0;

  return NextResponse.json({
    articles24h,
    eventsCreated: eventsCount || 0,
    summariesGenerated: summariesCount || 0,
    avgConfidence,
    runs: runsRes.data || [],
  });
}

