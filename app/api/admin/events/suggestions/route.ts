import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabaseServer';

function normalizeTitle(t: string): string {
  return (t || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getServerSupabase();
  const url = new URL(req.url);
  const limit = Math.max(10, Math.min(500, Number(url.searchParams.get('limit') || '200')));
  const titleThr = Math.max(0.5, Math.min(0.99, Number(url.searchParams.get('title') || '0.84')));
  const vectorThr = Math.max(0.5, Math.min(0.99, Number(url.searchParams.get('vector') || '0.92')));

  const { data: events } = await supabase
    .from('events')
    .select('id, canonical_title, last_updated_at')
    .order('last_updated_at', { ascending: false })
    .limit(limit);
  const evs = (events || []).map((e: any) => ({ id: e.id, title: e.canonical_title, norm: normalizeTitle(e.canonical_title), ts: new Date(e.last_updated_at || Date.now()).getTime() }));

  // Build centroids for all events in batch
  const ids = evs.map((e) => e.id);
  const centroids: Record<string, number[] | null> = {};
  for (const e of evs) centroids[e.id] = null;
  const { data: evArtsAll } = await supabase
    .from('event_articles')
    .select('event_id, article_id')
    .in('event_id', ids);
  const byEvent: Record<string, string[]> = {};
  (evArtsAll || []).forEach((ea: any) => {
    (byEvent[ea.event_id] = byEvent[ea.event_id] || []).push(ea.article_id);
  });
  // Fetch all article embeddings at once
  const allArtIds = Array.from(new Set((evArtsAll || []).map((ea: any) => ea.article_id)));
  const { data: arts } = await supabase
    .from('articles')
    .select('id, embedding')
    .in('id', allArtIds);
  const artVec: Record<string, number[]> = {};
  (arts || []).forEach((a: any) => {
    let v: number[] | null = null;
    if (Array.isArray(a.embedding)) v = a.embedding as number[];
    else if (typeof a.embedding === 'string') {
      try { v = JSON.parse(a.embedding as string); } catch {}
    }
    if (v && Array.isArray(v)) artVec[a.id] = v;
  });
  // Compute centroids per event
  for (const e of evs) {
    const artsIds = byEvent[e.id] || [];
    const vectors: number[][] = artsIds.map((id) => artVec[id]).filter(Boolean) as number[][];
    if (!vectors.length) { centroids[e.id] = null; continue; }
    const dim = vectors[0].length;
    const c = new Array(dim).fill(0);
    for (const v of vectors) for (let i = 0; i < dim; i++) c[i] += v[i];
    for (let i = 0; i < dim; i++) c[i] /= vectors.length;
    centroids[e.id] = c;
  }

  // Pairwise suggestions
  const sugg: Array<{ keepId: string; dropId: string; keepTitle: string; dropTitle: string; titleSim: number; vectorSim: number | null }> = [];
  for (let i = 0; i < evs.length; i++) {
    const a = evs[i];
    for (let j = i + 1; j < evs.length; j++) {
      const b = evs[j];
      const tSim = jaccard(a.norm, b.norm);
      let vSim: number | null = null;
      const cA = centroids[a.id];
      const cB = centroids[b.id];
      if (cA && cB && cA.length === cB.length) {
        let dot = 0, mA = 0, mB = 0;
        for (let k = 0; k < cA.length; k++) { dot += cA[k] * cB[k]; mA += cA[k] * cA[k]; mB += cB[k] * cB[k]; }
        vSim = dot / (Math.sqrt(mA) * Math.sqrt(mB));
      }
      if (tSim >= titleThr || (vSim !== null && vSim >= vectorThr)) {
        // Prefer keep with newer timestamp
        const keep = a.ts >= b.ts ? a : b;
        const drop = keep === a ? b : a;
        sugg.push({ keepId: keep.id, dropId: drop.id, keepTitle: keep.title, dropTitle: drop.title, titleSim: Number(tSim.toFixed(3)), vectorSim: vSim !== null ? Number(vSim.toFixed(3)) : null });
      }
    }
  }
  // Sort by combined score (favor vector if present)
  sugg.sort((x, y) => ((y.vectorSim ?? y.titleSim) - (x.vectorSim ?? x.titleSim)));
  return NextResponse.json({ ok: true, suggestions: sugg.slice(0, 50), titleThreshold: titleThr, vectorThreshold: vectorThr });
}

