import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabaseServer';
import { summarizeEventInAllLanguages, saveSummaries } from '@/lib/ai/summarize';
import { detectBiasForEvent } from '@/lib/ai/bias';

function normalizeTitle(t: string): string {
  return (t || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function jaccard(a: string, b: string): number {
  const ta = new Set(a.split(' '));
  const tb = new Set(b.split(' '));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  const union = ta.size + tb.size - inter;
  return inter / union;
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const limit = Math.max(10, Math.min(500, Number(body?.limit ?? 300)));
  const titleThr = Math.max(0.5, Math.min(0.99, Number(body?.titleThreshold ?? 0.84)));
  const vectorThr = Math.max(0.5, Math.min(0.99, Number(body?.vectorThreshold ?? 0.92)));
  const dryRun = !!body?.dryRun;
  const recompute = !!body?.recompute;

  // Load events
  const { data: events } = await supabase
    .from('events')
    .select('id, canonical_title, last_updated_at')
    .order('last_updated_at', { ascending: false })
    .limit(limit);
  const evs = (events || []).map((e: any) => ({ id: e.id, title: e.canonical_title, norm: normalizeTitle(e.canonical_title), ts: new Date(e.last_updated_at || Date.now()).getTime() }));

  // Build centroids
  const ids = evs.map((e) => e.id);
  const { data: evArtsAll } = await supabase
    .from('event_articles')
    .select('event_id, article_id')
    .in('event_id', ids);
  const byEvent: Record<string, string[]> = {};
  (evArtsAll || []).forEach((ea: any) => {
    (byEvent[ea.event_id] = byEvent[ea.event_id] || []).push(ea.article_id);
  });
  const allArtIds = Array.from(new Set((evArtsAll || []).map((ea: any) => ea.article_id)));
  const { data: arts } = await supabase
    .from('articles')
    .select('id, embedding')
    .in('id', allArtIds);
  const artVec: Record<string, number[]> = {};
  (arts || []).forEach((a: any) => {
    let v: number[] | null = null;
    if (Array.isArray(a.embedding)) v = a.embedding as number[];
    else if (typeof a.embedding === 'string') { try { v = JSON.parse(a.embedding as string); } catch {} }
    if (v) artVec[a.id] = v;
  });
  const centroids: Record<string, number[] | null> = {};
  for (const e of evs) {
    const ids = byEvent[e.id] || [];
    const vecs = ids.map((id) => artVec[id]).filter(Boolean) as number[][];
    if (!vecs.length) { centroids[e.id] = null; continue; }
    const dim = vecs[0].length;
    const c = new Array(dim).fill(0);
    for (const v of vecs) for (let i = 0; i < dim; i++) c[i] += v[i];
    for (let i = 0; i < dim; i++) c[i] /= vecs.length;
    centroids[e.id] = c;
  }

  // Suggest and apply
  const merges: Array<{ keepId: string; dropId: string; titleSim: number; vectorSim: number | null }> = [];
  const dropped = new Set<string>();
  const keepSet = new Set<string>();
  for (let i = 0; i < evs.length; i++) {
    const a = evs[i];
    if (dropped.has(a.id)) continue;
    for (let j = i + 1; j < evs.length; j++) {
      const b = evs[j];
      if (dropped.has(b.id)) continue;
      const tSim = jaccard(a.norm, b.norm);
      let vSim: number | null = null;
      const cA = centroids[a.id];
      const cB = centroids[b.id];
      if (cA && cB && cA.length === cB.length) {
        let dot = 0, mA = 0, mB = 0;
        for (let k = 0; k < cA.length; k++) { dot += cA[k] * cB[k]; mA += cA[k] * cA[k]; mB += cB[k] * cB[k]; }
        vSim = dot / (Math.sqrt(mA) * Math.sqrt(mB));
      }
      const pass = tSim >= titleThr || (vSim !== null && vSim >= vectorThr);
      if (pass) {
        const keep = a.ts >= b.ts ? a : b;
        const drop = keep === a ? b : a;
        merges.push({ keepId: keep.id, dropId: drop.id, titleSim: Number(tSim.toFixed(3)), vectorSim: vSim !== null ? Number(vSim.toFixed(3)) : null });
        if (!dryRun) {
          await supabase.from('event_source_coverage').update({ event_id: keep.id }).eq('event_id', drop.id);
          await supabase.from('event_articles').update({ event_id: keep.id }).eq('event_id', drop.id);
          await supabase.from('summaries').delete().eq('event_id', drop.id);
          await supabase.from('events').delete().eq('id', drop.id);
        }
        dropped.add(drop.id);
        keepSet.add(keep.id);
      }
    }
  }

  const recomputeResults: Array<{ eventId: string; summaries: boolean; bias: { analyzed: number; failed: number } | null }> = [];
  if (!dryRun && recompute) {
    for (const kid of keepSet) {
      const sums = await summarizeEventInAllLanguages(kid);
      if (sums) await saveSummaries(kid, sums);
      const bias = await detectBiasForEvent(kid);
      recomputeResults.push({ eventId: kid, summaries: !!sums, bias });
    }
  }

  return NextResponse.json({ ok: true, applied: dryRun ? 0 : dropped.size, suggested: merges.length, merges: merges.slice(0, 100), dryRun, titleThreshold: titleThr, vectorThreshold: vectorThr, recompute: recomputeResults });
}
