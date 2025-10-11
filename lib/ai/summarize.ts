/**
 * AI Summarization Service
 * Generates neutral, factual summaries from multiple article sources
 */

import { chatCompletion } from './azure';
import { getServerSupabase } from '../supabaseServer';
import { getPageText } from '../content';
const supabase = getServerSupabase();

export interface ArticleForSummary {
  id: string;
  title: string;
  content_text: string;
  source_name?: string;
  published_at: string;
}

export interface EventSummary {
  neutral_summary: string;
  neutral_detail: string;
  confidence: number;
}

/**
 * Generate neutral summary from multiple articles
 */
export async function generateNeutralSummary(
  articles: ArticleForSummary[]
): Promise<EventSummary> {
  if (articles.length === 0) {
    throw new Error('No articles provided for summarization');
  }

  // Prepare article texts for the prompt
  const articleTexts = articles
    .map((a, i) => `[Article ${i + 1} from ${a.source_name || 'Unknown'}]\nTitle: ${a.title}\n${a.content_text.substring(0, 1000)}`)
    .join('\n\n---\n\n');

  const prompt = `You are an impartial journalist summarizing news from multiple Sri Lankan outlets.

Task: Create a NEUTRAL, FACTUAL summary of the event described in these articles.

Guidelines:
- Report only VERIFIED FACTS mentioned by ≥2 sources
- NO speculation, opinions, or adjectives
- NO bias toward any political party or entity
- Focus on WHO, WHAT, WHEN, WHERE, WHY
- Use neutral, professional language
- Cite source names when claims differ

Articles:
${articleTexts}

Output TWO sections:

1. SUMMARY (4-6 sentences, ≤800 chars):
Brief overview of the key facts. Start directly with the news.

2. DETAILED (≤1500 chars):
Expand with additional context, quotes, and nuances. Include how different outlets framed it if there are differences.

Format:
SUMMARY:
[your summary here]

DETAILED:
[your detailed version here]`;

  try {
    const response = await chatCompletion({
      messages: [
        { role: 'system', content: 'You are a neutral news analyst for Sri Lankan media.' },
        { role: 'user', content: prompt },
      ],
      // Note: gpt-5-mini only supports temperature=1 (default)
      max_completion_tokens: 2000,
    });

    // Parse response
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=DETAILED:|$)/i);
    const detailedMatch = response.match(/DETAILED:\s*([\s\S]*?)$/i);

    const summary = summaryMatch?.[1]?.trim() || response.substring(0, 800);
    const detailed = detailedMatch?.[1]?.trim() || response;

    // Calculate confidence based on source agreement
    const confidence = calculateConfidence(articles);

    return {
      neutral_summary: summary,
      neutral_detail: detailed,
      confidence,
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    throw error;
  }
}

/**
 * Calculate confidence score based on:
 * - Number of sources (more = better)
 * - Source reliability (from sources table)
 * - Text similarity (future enhancement)
 */
function calculateConfidence(articles: ArticleForSummary[]): number {
  const sourceCount = articles.length;

  // Base score: 40 + (10 per additional source, max 40)
  const sourceScore = Math.min(40 + (sourceCount - 1) * 10, 80);

  // Reliability bonus (placeholder - would fetch from sources table)
  const reliabilityScore = 20;

  return Math.min(sourceScore + reliabilityScore, 100);
}

/**
 * Summarize event in all three languages
 */
export async function summarizeEventInAllLanguages(
  eventId: string
): Promise<{ en: EventSummary; si: EventSummary; ta: EventSummary } | null> {
  // Fetch article IDs for this event via event_articles link table
  const { data: evArts, error: evArtsErr } = await supabase
    .from('event_articles')
    .select('article_id')
    .eq('event_id', eventId);

  if (evArtsErr || !evArts || evArts.length === 0) {
    console.error('No linked articles found for event:', eventId);
    return null;
  }

  const articleIds = evArts.map((e: any) => e.article_id);

  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, content_text, published_at, source_id, url')
    .in('id', articleIds);

  if (articlesError || !articles || articles.length === 0) {
    console.error('Failed to fetch articles:', articlesError);
    return null;
  }

  // Fetch source names
  const sourceIds = [...new Set(articles.map((a: any) => a.source_id))];
  const { data: sources } = await supabase
    .from('sources')
    .select('id, name')
    .in('id', sourceIds);

  const sourceMap = new Map((sources || []).map((s: any) => [s.id, s.name]));

  const articlesWithSources = [] as any[];
  for (const a of (articles || [])) {
    let content = a.content_text || '';
    if (!content || content.length < 200) {
      const fetched = a.url ? await getPageText(a.url) : null;
      if (fetched) content = fetched;
    }
    articlesWithSources.push({
      ...a,
      content_text: content,
      source_name: sourceMap.get(a.source_id) || 'Unknown',
    });
  }

  try {
    // Generate English summary
    const enSummary = await generateNeutralSummary(articlesWithSources);

    // Generate Sinhala and Tamil translations
    const siSummary = await translateSummary(enSummary, 'si');
    const taSummary = await translateSummary(enSummary, 'ta');

    return {
      en: enSummary,
      si: siSummary,
      ta: taSummary,
    };
  } catch (error) {
    console.error('Failed to summarize event:', error);
    return null;
  }
}

/**
 * Translate summary to Sinhala or Tamil
 */
async function translateSummary(
  summary: EventSummary,
  targetLang: 'si' | 'ta'
): Promise<EventSummary> {
  const langName = targetLang === 'si' ? 'Sinhala' : 'Tamil';

  const prompt = `Translate and localize this news summary into ${langName}.

Guidelines:
- Preserve ALL facts and names EXACTLY
- Use natural ${langName} newsroom tone for Sri Lankan readers
- Avoid literal machine translation - make it read naturally
- Keep proper nouns in original form (names, places)

SUMMARY TO TRANSLATE:
${summary.neutral_summary}

DETAILED TO TRANSLATE:
${summary.neutral_detail}

Output format:
SUMMARY:
[${langName} translation]

DETAILED:
[${langName} translation]`;

  try {
    const response = await chatCompletion({
      messages: [
        { role: 'system', content: `You are a professional ${langName} translator for Sri Lankan news.` },
        { role: 'user', content: prompt },
      ],
      // Note: gpt-5-mini only supports temperature=1 (default)
      max_completion_tokens: 2500,
    });

    // Parse response
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=DETAILED:|$)/i);
    const detailedMatch = response.match(/DETAILED:\s*([\s\S]*?)$/i);

    return {
      neutral_summary: summaryMatch?.[1]?.trim() || response.substring(0, 800),
      neutral_detail: detailedMatch?.[1]?.trim() || response,
      confidence: summary.confidence,
    };
  } catch (error) {
    console.error(`Failed to translate to ${langName}:`, error);
    // Fallback to original English
    return summary;
  }
}

/**
 * Save summaries to database
 */
export async function saveSummaries(
  eventId: string,
  summaries: { en: EventSummary; si: EventSummary; ta: EventSummary }
): Promise<void> {
  const records = [
    { event_id: eventId, lang: 'en', ...summaries.en },
    { event_id: eventId, lang: 'si', ...summaries.si },
    { event_id: eventId, lang: 'ta', ...summaries.ta },
  ];

  const { error } = await supabase
    .from('summaries')
    .upsert(records, { onConflict: 'event_id,lang' });

  if (error) {
    console.error('Failed to save summaries:', error);
    throw error;
  }
}

/**
 * Summarize all events that don't have summaries yet
 */
export async function summarizeNewEvents(): Promise<{
  eventsProcessed: number;
  summariesCreated: number;
  failed: number;
}> {
  console.log('Starting event summarization...');

  // Find events without summaries
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .limit(20);

  if (eventsError || !events) {
    console.error('Failed to fetch events:', eventsError);
    return { eventsProcessed: 0, summariesCreated: 0, failed: 0 };
  }

  // Filter events that already have summaries
  const { data: existingSummaries } = await supabase
    .from('summaries')
    .select('event_id')
    .in('event_id', events.map(e => e.id));

  const summarizedIds = new Set((existingSummaries || []).map((s: any) => s.event_id));
  const eventsToProcess = events.filter(e => !summarizedIds.has(e.id));

  console.log(`Found ${eventsToProcess.length} events needing summaries`);

  let summariesCreated = 0;
  let failed = 0;

  for (const event of eventsToProcess) {
    try {
      const summaries = await summarizeEventInAllLanguages(event.id);
      if (summaries) {
        await saveSummaries(event.id, summaries);
        summariesCreated += 3; // EN, SI, TA
        console.log(`Summarized event ${event.id} in 3 languages`);
      } else {
        failed++;
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to summarize event ${event.id}:`, error);
      failed++;
    }
  }

  return {
    eventsProcessed: eventsToProcess.length,
    summariesCreated,
    failed,
  };
}
