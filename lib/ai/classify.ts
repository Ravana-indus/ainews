/**
 * Event Classification Service
 * Determines category and newsworthiness (is_news) of events
 */
import { chatCompletion } from './azure';
import { getServerSupabase } from '../supabaseServer';
const supabase = getServerSupabase();

const CATEGORIES = ['Politics','Economy','Health','Education','Justice','Security','Sports','Environment','Transport','Technology','Local','International'];

export async function classifyEvent(eventId: string): Promise<{ category: string; is_news: boolean } | null> {
  // Fetch articles linked to event
  const { data: evArts } = await supabase
    .from('event_articles')
    .select('article_id')
    .eq('event_id', eventId);
  const ids = (evArts || []).map((e: any) => e.article_id);
  if (!ids.length) return null;
  const { data: arts } = await supabase
    .from('articles')
    .select('title, content_text')
    .in('id', ids);
  const corpus = (arts || []).map((a: any, i: number) => `#${i+1} ${a.title}\n${(a.content_text || '').slice(0, 800)}`).join('\n\n');
  const prompt = `Classify the following Sri Lankan news event into one category and decide if it is newsworthy.

Categories: ${CATEGORIES.join(', ')}
Newsworthy: true if it reports actual news (multiple sources, factual update), false if promotional, opinion, or non-news.

Corpus:\n${corpus}

Return JSON: { "category": "one of ${CATEGORIES.join('|')}", "is_news": true|false }`;
  try {
    const response = await chatCompletion({
      messages: [
        { role: 'system', content: 'You are a strict news classifier for Sri Lankan media.' },
        { role: 'user', content: prompt },
      ],
      // Note: gpt-5-mini only supports temperature=1 (default)
      max_completion_tokens: 200,
    });
    const m = response.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    const cat = CATEGORIES.includes(parsed.category) ? parsed.category : 'Local';
    const isNews = !!parsed.is_news;
    return { category: cat, is_news: isNews };
  } catch {
    return null;
  }
}

export async function classifyNewEvents(): Promise<{ eventsProcessed: number; categoriesAssigned: number; nonNewsFlagged: number }> {
  // Find recent events needing classification (General category or null)
  const { data: events } = await supabase
    .from('events')
    .select('id, category, is_news')
    .order('last_updated_at', { ascending: false })
    .limit(50);
  const toProcess = (events || []).filter((e: any) => !e.category || e.category === 'General');
  let categoriesAssigned = 0;
  let nonNewsFlagged = 0;
  for (const e of toProcess) {
    const result = await classifyEvent(e.id);
    if (result) {
      await supabase.from('events').update({ category: result.category, is_news: result.is_news }).eq('id', e.id);
      categoriesAssigned += result.category ? 1 : 0;
      nonNewsFlagged += result.is_news ? 0 : 1;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return { eventsProcessed: toProcess.length, categoriesAssigned, nonNewsFlagged };
}

