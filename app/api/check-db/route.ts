import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../lib/supabaseServer';

export async function GET() {
  const supabase = getServerSupabase();
  const eventId = '4de584ef-e277-4a53-ab38-af4a95d6d605';

  const { data: summaries, error: sumErr } = await supabase
    .from('summaries')
    .select('*')
    .eq('event_id', eventId);

  const { data: coverage, error: covErr } = await supabase
    .from('event_source_coverage')
    .select('*')
    .eq('event_id', eventId);

  return NextResponse.json({
    summaries: summaries || [],
    coverage: coverage || [],
    errors: {
      summaries: sumErr?.message || null,
      coverage: covErr?.message || null,
    }
  });
}
