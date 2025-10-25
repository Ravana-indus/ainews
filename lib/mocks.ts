export type LanguageCode = 'en' | 'si' | 'ta';

export type Source = {
  id: string;
  name: string;
  domain: string;
  language: LanguageCode;
  reliability: number;
  logoUrl: string;
};

export type SourceCoverage = {
  sourceId: string;
  sourceName?: string;
  sourceLogo?: string | null;
  headline: string;
  lean: -2 | -1 | 0 | 1 | 2;
  reason: string;
  url: string;
  publishedAt: string;
};

export type EventItem = {
  id: string;
  title: string;
  summary: { en: string; si: string; ta: string };
  detail: { en: string; si: string; ta: string };
  updatedAt: string;
  confidence: number;
  category: string;
  sources: SourceCoverage[];
  biasSummary: { sourceId: string; score: -2 | -1 | 0 | 1 | 2; label: string }[];
};

export type KPI = {
  articles24h: number;
  eventsCreated: number;
  summariesGenerated: number;
  failures: number;
  avgConfidence: number;
};

// Mock KPI data - used only for initial display before real data loads
export const kpi: KPI = {
  articles24h: 0,
  eventsCreated: 0,
  summariesGenerated: 0,
  failures: 0,
  avgConfidence: 75,
};
