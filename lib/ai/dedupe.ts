import { getServerSupabase } from '../supabaseServer';
const supabase = getServerSupabase();

function normalizeTitle(t: string): string {
  return (t || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string): number {
  const ta = new Set(a.split(' '));
  const tb = new Set(b.split(' '));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  const union = ta.size + tb.size - inter;
  return inter / union;
}

export async function dedupeRecentEvents(threshold: number = 0.82, limit: number = 200): Promise<{ merged: number; checked: number }> {
  const { data: events } = await supabase
    .from('events')
    .select('id, canonical_title, last_updated_at')
    .order('last_updated_at', { ascending: false })
    .limit(limit);
  const items = (events || []).map((e: any) => ({ id: e.id, norm: normalizeTitle(e.canonical_title), ts: new Date(e.last_updated_at || Date.now()).getTime() }));
  let merged = 0;
  const used = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (used.has(a.id)) continue;
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (used.has(b.id)) continue;
      const sim = similarity(a.norm, b.norm);
      if (sim >= threshold) {
        // Keep the newer event (smaller j if sorted desc by time)
        const keep = a.ts >= b.ts ? a : b;
        const drop = keep === a ? b : a;
        // Move coverage
        await supabase.from('event_source_coverage').update({ event_id: keep.id }).eq('event_id', drop.id);
        // Move event_articles
        await supabase.from('event_articles').update({ event_id: keep.id }).eq('event_id', drop.id);
        // Drop summaries of duplicate
        await supabase.from('summaries').delete().eq('event_id', drop.id);
        // Delete duplicate event
        await supabase.from('events').delete().eq('id', drop.id);
        used.add(drop.id);
        merged++;
      }
    }
  }
  return { merged, checked: items.length };
}

export async function dedupeRecentEventsDetailed(
  threshold: number = 0.82,
  limit: number = 200,
  dryRun: boolean = false
): Promise<{ merged: number; checked: number; details: Array<{ keepId: string; keepTitle: string; dropId: string; dropTitle: string; similarity: number }> }> {
  const { data: events } = await supabase
    .from('events')
    .select('id, canonical_title, last_updated_at')
    .order('last_updated_at', { ascending: false })
    .limit(limit);
  const items = (events || []).map((e: any) => ({
    id: e.id,
    title: e.canonical_title as string,
    norm: normalizeTitle(e.canonical_title),
    ts: new Date(e.last_updated_at || Date.now()).getTime(),
  }));
  let merged = 0;
  const details: Array<{ keepId: string; keepTitle: string; dropId: string; dropTitle: string; similarity: number }> = [];
  const used = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (used.has(a.id)) continue;
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (used.has(b.id)) continue;
      const sim = similarity(a.norm, b.norm);
      if (sim >= threshold) {
        const keep = a.ts >= b.ts ? a : b;
        const drop = keep === a ? b : a;
        details.push({ keepId: keep.id, keepTitle: keep.title, dropId: drop.id, dropTitle: drop.title, similarity: Number(sim.toFixed(3)) });
        if (!dryRun) {
          await supabase.from('event_source_coverage').update({ event_id: keep.id }).eq('event_id', drop.id);
          await supabase.from('event_articles').update({ event_id: keep.id }).eq('event_id', drop.id);
          await supabase.from('summaries').delete().eq('event_id', drop.id);
          await supabase.from('events').delete().eq('id', drop.id);
        }
        used.add(drop.id);
        merged++;
      }
    }
  }
  return { merged, checked: items.length, details };
}
