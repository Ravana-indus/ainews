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
  const aId = url.searchParams.get('a');
  const bId = url.searchParams.get('b');
  if (!aId || !bId || aId === bId) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const { data: evA } = await supabase.from('events').select('id, canonical_title').eq('id', aId).maybeSingle();
  const { data: evB } = await supabase.from('events').select('id, canonical_title').eq('id', bId).maybeSingle();
  if (!evA || !evB) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Build centroids from article embeddings
  async function centroid(eventId: string): Promise<number[] | null> {
    const { data: evArts } = await supabase.from('event_articles').select('article_id').eq('event_id', eventId);
    const artIds = (evArts || []).map((x: any) => x.article_id);
    if (!artIds.length) return null;
    const { data: arts } = await supabase.from('articles').select('id, embedding').in('id', artIds);
    const vectors: number[][] = [];
    for (const a of (arts || [])) {
      let v: number[] | null = null;
      if (Array.isArray(a.embedding)) v = a.embedding as number[];
      else if (typeof a.embedding === 'string') {
        try { v = JSON.parse(a.embedding as string); } catch {}
      }
      if (v && Array.isArray(v) && v.length) vectors.push(v);
    }
    if (!vectors.length) return null;
    const dim = vectors[0].length;
    const c = new Array(dim).fill(0);
    for (const v of vectors) for (let i = 0; i < dim; i++) c[i] += v[i];
    for (let i = 0; i < dim; i++) c[i] /= vectors.length;
    return c;
  }

  const nA = normalizeTitle(evA.canonical_title);
  const nB = normalizeTitle(evB.canonical_title);
  const titleSim = jaccard(nA, nB);

  const cA = await centroid(evA.id);
  const cB = await centroid(evB.id);
  let vectorSim = null as number | null;
  if (cA && cB && cA.length === cB.length) {
    // cosine similarity
    let dot = 0, mA = 0, mB = 0;
    for (let i = 0; i < cA.length; i++) { dot += cA[i] * cB[i]; mA += cA[i] * cA[i]; mB += cB[i] * cB[i]; }
    vectorSim = dot / (Math.sqrt(mA) * Math.sqrt(mB));
  }

  return NextResponse.json({ ok: true, a: evA.id, b: evB.id, titleSim: Number(titleSim.toFixed(3)), vectorSim: vectorSim !== null ? Number(vectorSim.toFixed(3)) : null });
}

