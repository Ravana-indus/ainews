/**
 * Bias Detection Service
 * Analyzes tone and framing of articles to detect political/editorial lean
 */

import { chatCompletion } from './azure';
import { getServerSupabase } from '../supabaseServer';
const supabase = getServerSupabase();

export interface BiasAnalysis {
  lean_score: -2 | -1 | 0 | 1 | 2;
  reason: string;
  confidence: number;
}

/**
 * Analyze bias in an article's coverage
 */
export async function analyzeBias(
  articleTitle: string,
  articleContent: string,
  eventContext?: string
): Promise<BiasAnalysis> {
  const prompt = `Analyze the TONE and FRAMING of this Sri Lankan news article.

${eventContext ? `Event context: ${eventContext}\n` : ''}
Article Title: ${articleTitle}

Article Content:
${articleContent.substring(0, 2000)}

Task: Rate the article's LEAN toward the main subject/event.

Scoring rubric:
-2 = Strongly Critical (harsh criticism, negative framing, blame-focused)
-1 = Skeptical (questions raised, concerns highlighted, cautious tone)
 0 = Neutral (factual reporting, balanced, no clear lean)
+1 = Favorable (positive framing, benefits emphasized, supportive tone)
+2 = Strongly Favorable (praise-heavy, promotional, advocacy)

Guidelines:
- Focus on WORD CHOICE and STORY FRAMING, not just facts
- Consider what is EMPHASIZED vs. OMITTED
- Look for loaded adjectives, verbs, and descriptors
- Check headline vs. content alignment
- Be sensitive to Sri Lankan political context

Output ONLY valid JSON:
{
  "lean_score": -2 | -1 | 0 | 1 | 2,
  "reason": "Brief 1-line explanation of the lean",
  "confidence": 0.0-1.0
}`;

  try {
    const response = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an expert media analyst specializing in Sri Lankan news bias detection.',
        },
        { role: 'user', content: prompt },
      ],
      // Note: gpt-5-mini only supports temperature=1 (default)
      max_completion_tokens: 300,
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from bias analysis');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate lean_score is in valid range
    if (![ -2, -1, 0, 1, 2 ].includes(parsed.lean_score)) {
      console.warn('Invalid lean_score, defaulting to 0:', parsed.lean_score);
      parsed.lean_score = 0;
    }

    return {
      lean_score: parsed.lean_score,
      reason: parsed.reason || 'No reason provided',
      confidence: parsed.confidence || 0.7,
    };
  } catch (error) {
    console.error('Bias analysis failed:', error);
    // Return neutral with low confidence on error
    return {
      lean_score: 0,
      reason: 'Analysis failed - defaulted to neutral',
      confidence: 0,
    };
  }
}

/**
 * Update event source coverage with bias scores
 */
export async function detectBiasForEvent(eventId: string): Promise<{
  analyzed: number;
  failed: number;
}> {
  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, canonical_title')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    console.error('Event not found:', eventId);
    return { analyzed: 0, failed: 0 };
  }

  // Fetch coverage entries for this event
  const { data: coverage, error: coverageError } = await supabase
    .from('event_source_coverage')
    .select('source_id, headline, lean, url')
    .eq('event_id', eventId);

  if (coverageError || !coverage) {
    console.error('No coverage found for event:', eventId);
    return { analyzed: 0, failed: 0 };
  }

  // Filter articles that need bias analysis (lean is null or 0)
  const toAnalyzeCoverage = coverage.filter((c: any) => c.lean === null || c.lean === 0);

  if (toAnalyzeCoverage.length === 0) {
    return { analyzed: 0, failed: 0 };
  }

  // Find corresponding article IDs via URL or by source linkage in event_articles
  const { data: evArts } = await supabase
    .from('event_articles')
    .select('article_id')
    .eq('event_id', eventId);

  const { data: artList } = await supabase
    .from('articles')
    .select('id, title, content_text, url');

  const urlToArticleId = new Map((artList || []).map((a: any) => [a.url, a.id]));
  const articleIds = toAnalyzeCoverage
    .map((c: any) => urlToArticleId.get(c.url))
    .filter(Boolean) as string[];
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, content_text')
    .in('id', articleIds);

  if (!articles || articles.length === 0) {
    return { analyzed: 0, failed: 0 };
  }

  let analyzed = 0;
  let failed = 0;

  for (const article of articles) {
    try {
      const biasResult = await analyzeBias(
        article.title,
        article.content_text,
        event.canonical_title
      );

      // Update coverage record
      const { error: updateError } = await supabase
        .from('event_source_coverage')
        .update({
          lean: biasResult.lean_score,
          reason: biasResult.reason,
        })
        .eq('event_id', eventId)
        .eq('url', (artList || []).find((a: any) => a.id === article.id)?.url || '');

      if (updateError) {
        console.error('Failed to update bias score:', updateError);
        failed++;
      } else {
        analyzed++;
        console.log(`Analyzed bias for article ${article.id}: ${biasResult.lean_score} (${biasResult.reason})`);
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to analyze bias for article ${article.id}:`, error);
      failed++;
    }
  }

  return { analyzed, failed };
}

/**
 * Detect bias for all events that need analysis
 */
export async function detectBiasForAllEvents(): Promise<{
  eventsProcessed: number;
  articlesAnalyzed: number;
  failed: number;
}> {
  console.log('Starting bias detection...');

  // Find recent events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .order('last_updated_at', { ascending: false })
    .limit(10);

  if (eventsError || !events) {
    console.error('Failed to fetch events:', eventsError);
    return { eventsProcessed: 0, articlesAnalyzed: 0, failed: 0 };
  }

  let totalAnalyzed = 0;
  let totalFailed = 0;

  for (const event of events) {
    const result = await detectBiasForEvent(event.id);
    totalAnalyzed += result.analyzed;
    totalFailed += result.failed;
  }

  return {
    eventsProcessed: events.length,
    articlesAnalyzed: totalAnalyzed,
    failed: totalFailed,
  };
}
