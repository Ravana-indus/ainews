import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../lib/supabaseServer';

export async function GET() {
  const supabase = getServerSupabase();
  const eventId = '4de584ef-e277-4a53-ab38-af4a95d6d605';

  // First, check if the event exists
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  // Then check coverage with detailed error
  const { data: coverage, error: covError, count } = await supabase
    .from('event_source_coverage')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId);

  // Also try without filter to see if table has any data
  const { data: allCoverage, count: totalCount } = await supabase
    .from('event_source_coverage')
    .select('*', { count: 'exact' })
    .limit(5);

  return NextResponse.json({
    eventExists: !!event,
    event: event ? { id: event.id, title: event.canonical_title } : null,
    eventError: eventError?.message || null,

    coverageForThisEvent: coverage || [],
    coverageCount: count,
    coverageError: covError?.message || null,

    sampleCoverageFromTable: allCoverage || [],
    totalCoverageInTable: totalCount,

    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
