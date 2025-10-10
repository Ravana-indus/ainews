import { getServerSupabase } from '../supabaseServer';
const supabase = getServerSupabase();
import { cosineSimilarity } from './embeddings';

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

export async function dedupeByVectorDetailed(
  threshold: number = 0.9,
  limit: number = 200,
  dryRun: boolean = false
): Promise<{ merged: number; checked: number; details: Array<{ keepId: string; dropId: string; similarity: number }> }> {
  // Fetch recent events
  const { data: events } = await supabase
    .from('events')
    .select('id, last_updated_at')
    .order('last_updated_at', { ascending: false })
    .limit(limit);
  const evs = (events || []).map((e: any) => ({ id: e.id }));

  // For each event, build centroid from linked article embeddings
  const centroids: Record<string, number[]> = {};
  for (const e of evs) {
    const { data: evArts } = await supabase
      .from('event_articles')
      .select('article_id')
      .eq('event_id', e.id);
    const artIds = (evArts || []).map((x: any) => x.article_id);
    if (!artIds.length) continue;
    const { data: arts } = await supabase
      .from('articles')
      .select('id, embedding')
      .in('id', artIds);
    const vectors: number[][] = [];
    for (const a of (arts || [])) {
      let v: number[] | null = null;
      if (Array.isArray(a.embedding)) v = a.embedding as number[];
      else if (typeof a.embedding === 'string') {
        try { v = JSON.parse(a.embedding as string); } catch {}
      }
      if (v && Array.isArray(v) && v.length) vectors.push(v);
    }
    if (!vectors.length) continue;
    const dim = vectors[0].length;
    const centroid = new Array(dim).fill(0);
    for (const v of vectors) for (let i = 0; i < dim; i++) centroid[i] += v[i];
    for (let i = 0; i < dim; i++) centroid[i] /= vectors.length;
    centroids[e.id] = centroid;
  }

  const ids = Object.keys(centroids);
  let merged = 0;
  const details: Array<{ keepId: string; dropId: string; similarity: number }> = [];
  const used = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    const aId = ids[i];
    if (used.has(aId)) continue;
    const aC = centroids[aId];
    for (let j = i + 1; j < ids.length; j++) {
      const bId = ids[j];
      if (used.has(bId)) continue;
      const bC = centroids[bId];
      if (!aC || !bC || aC.length !== bC.length) continue;
      const sim = cosineSimilarity(aC, bC);
      if (sim >= threshold) {
        // Keep the first (more recent due to ordering), drop the other
        const keep = aId;
        const drop = bId;
        details.push({ keepId: keep, dropId: drop, similarity: Number(sim.toFixed(3)) });
        if (!dryRun) {
          await supabase.from('event_source_coverage').update({ event_id: keep }).eq('event_id', drop);
          await supabase.from('event_articles').update({ event_id: keep }).eq('event_id', drop);
          await supabase.from('summaries').delete().eq('event_id', drop);
          await supabase.from('events').delete().eq('id', drop);
        }
        used.add(drop);
        merged++;
      }
    }
  }
  return { merged, checked: ids.length, details };
}
