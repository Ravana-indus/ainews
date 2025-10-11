import { supabase } from './supabaseClient';
import type { EventItem, LanguageCode } from './mocks';

export async function fetchEvents(lang: LanguageCode, category?: string): Promise<EventItem[]> {
  const { data: evts, error: evtErr } = await supabase
    .from('events')
    .select('id, canonical_title, category, last_updated_at, importance_score, is_news')
    .eq('is_news', true)
    .order('last_updated_at', { ascending: false });
  if (evtErr || !evts) return [];

  const eventIds = evts.map((e: any) => e.id);
  const { data: sums } = await supabase
    .from('summaries')
    .select('event_id, lang, neutral_summary, neutral_detail, confidence')
    .in('event_id', eventIds);

  const summariesByEvent: Record<string, { neutral_summary: string; neutral_detail: string; confidence: number; lang: LanguageCode }[]> = {};
  (sums || []).forEach((s: any) => {
    summariesByEvent[s.event_id] = summariesByEvent[s.event_id] || [];
    summariesByEvent[s.event_id].push(s);
  });

  // In MVP, sources and biasSummary are empty; could be joined later.
  const result: EventItem[] = evts
    .filter((e: any) => !category || e.category === category)
    .map((e: any) => {
    const sumForEvent = summariesByEvent[e.id] || [];
    const perLang = (lc: LanguageCode) => (sumForEvent.find((x) => x.lang === lc) || { neutral_summary: '', neutral_detail: '', confidence: 0, lang: lc });
    return {
      id: e.id,
      title: e.canonical_title,
      summary: {
        en: perLang('en').neutral_summary || '',
        si: perLang('si').neutral_summary || '',
        ta: perLang('ta').neutral_summary || '',
      },
      detail: {
        en: perLang('en').neutral_detail || '',
        si: perLang('si').neutral_detail || '',
        ta: perLang('ta').neutral_detail || '',
      },
      updatedAt: e.last_updated_at || new Date().toISOString(),
      confidence: Math.round(perLang(lang).confidence || e.importance_score || 0),
      category: e.category || 'General',
      sources: [],
      biasSummary: [],
    };
  });

  // Attach minimal source coverage and bias summary for cards
  if (eventIds.length) {
    const { data: cov } = await supabase
      .from('event_source_coverage')
      .select('event_id, source_id, headline, lean, reason, url, published_at')
      .in('event_id', eventIds);
    const { data: srcs } = await supabase
      .from('sources')
      .select('id, name, logo_url');
    const srcMap: Record<string, { name: string; logo_url: string | null }> = {};
    (srcs || []).forEach((s: any) => { srcMap[s.id] = { name: s.name, logo_url: s.logo_url || null }; });
    const byEventCov: Record<string, any[]> = {};
    (cov || []).forEach((c: any) => {
      byEventCov[c.event_id] = byEventCov[c.event_id] || [];
      byEventCov[c.event_id].push({
        sourceId: c.source_id,
        sourceName: srcMap[c.source_id]?.name,
        sourceLogo: srcMap[c.source_id]?.logo_url,
        headline: c.headline,
        lean: c.lean,
        reason: c.reason,
        url: c.url,
        publishedAt: c.published_at,
      });
    });
    result.forEach((r) => {
      const covList = (byEventCov[r.id] || []).slice(0, 4);
      r.sources = covList;
      r.biasSummary = covList.map((c: any) => ({
        sourceId: c.sourceId,
        score: c.lean as -2 | -1 | 0 | 1 | 2,
        label: c.lean === 0 ? 'Neutral 0' : c.lean > 0 ? `Favorable +${c.lean}` : `Critical ${c.lean}`,
      }));
    });
  }

  return result;
}

export async function fetchEventById(id: string, lang: LanguageCode): Promise<EventItem | null> {
  const { data: e, error } = await supabase
    .from('events')
    .select('id, canonical_title, category, last_updated_at, importance_score')
    .eq('id', id)
    .maybeSingle();
  if (error || !e) return null;

  const { data: sums } = await supabase
    .from('summaries')
    .select('event_id, lang, neutral_summary, neutral_detail, confidence')
    .eq('event_id', id);

  const perLang = (lc: LanguageCode) => ((sums || []).find((x: any) => x.lang === lc) || { neutral_summary: '', neutral_detail: '', confidence: 0, lang: lc }) as { neutral_summary: string; neutral_detail: string; confidence: number; lang: LanguageCode };

  const base: EventItem = {
    id: e.id,
    title: e.canonical_title,
    summary: {
      en: perLang('en').neutral_summary || '',
      si: perLang('si').neutral_summary || '',
      ta: perLang('ta').neutral_summary || '',
    },
    detail: {
      en: perLang('en').neutral_detail || '',
      si: perLang('si').neutral_detail || '',
      ta: perLang('ta').neutral_detail || '',
    },
    updatedAt: e.last_updated_at || new Date().toISOString(),
    confidence: Math.round(perLang(lang).confidence || e.importance_score || 0),
    category: e.category || 'General',
    sources: [],
    biasSummary: [],
  };

  // Attach source coverage and bias summary
  const { data: cov } = await supabase
    .from('event_source_coverage')
    .select('event_id, source_id, headline, lean, reason, url, published_at')
    .eq('event_id', id);
  const { data: srcs } = await supabase
    .from('sources')
    .select('id, name, logo_url');
  const srcMap: Record<string, { name: string; logo_url: string | null }> = {};
  (srcs || []).forEach((s: any) => { srcMap[s.id] = { name: s.name, logo_url: s.logo_url || null }; });
  base.sources = (cov || []).map((c: any) => ({
    sourceId: c.source_id,
    sourceName: srcMap[c.source_id]?.name,
    sourceLogo: srcMap[c.source_id]?.logo_url,
    headline: c.headline,
    lean: c.lean,
    reason: c.reason,
    url: c.url,
    publishedAt: c.published_at,
  }));
  base.biasSummary = base.sources.map((c: any) => ({
    sourceId: c.sourceId,
    score: c.lean as -2 | -1 | 0 | 1 | 2,
    label: c.lean === 0 ? 'Neutral 0' : c.lean > 0 ? `Favorable +${c.lean}` : `Critical ${c.lean}`,
  }));

  return base;
}

export async function fetchSources(): Promise<any[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('id, name, domain, language, reliability, logo_url')
    .order('name', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function fetchKPI(): Promise<{ articles24h: number; eventsCreated: number; summariesGenerated: number; failures: number; avgConfidence: number; }> {
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const [{ count: eventsCount }, { count: summariesCount }, articlesRes] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('summaries').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('id, published_at').gte('published_at', since),
  ]);
  const articles24h = (articlesRes.data || []).length;
  const failures = 0;
  let avgConfidence = 0;
  const { data: confs } = await supabase.from('summaries').select('confidence');
  if (confs && confs.length) {
    const nums = confs.map((c: any) => Number(c.confidence || 0));
    avgConfidence = Math.round(nums.reduce((a: number, b: number) => a + b, 0) / nums.length);
  }
  return {
    articles24h,
    eventsCreated: eventsCount || 0,
    summariesGenerated: summariesCount || 0,
    failures,
    avgConfidence,
  };
}

export async function fetchLatestArticles(limit: number = 10): Promise<{ title: string; url: string; publishedAt: string; sourceId: string; sourceName?: string; sourceLogo?: string | null; }[]> {
  const { data: arts, error: artErr } = await supabase
    .from('articles')
    .select('id, source_id, title, url, published_at')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (artErr || !arts || !arts.length) return [];
  const srcIds = Array.from(new Set((arts || []).map((a: any) => a.source_id).filter(Boolean)));
  let srcMap: Record<string, { name: string; logo_url: string | null }> = {};
  if (srcIds.length) {
    const { data: srcs } = await supabase
      .from('sources')
      .select('id, name, logo_url')
      .in('id', srcIds);
    (srcs || []).forEach((s: any) => { srcMap[s.id] = { name: s.name, logo_url: s.logo_url || null }; });
  }
  return (arts || []).map((a: any) => ({
    title: a.title,
    url: a.url,
    publishedAt: a.published_at,
    sourceId: a.source_id,
    sourceName: srcMap[a.source_id]?.name,
    sourceLogo: srcMap[a.source_id]?.logo_url || null,
  }));
}
