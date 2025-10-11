import { chatCompletion } from './azure';
import { getServerSupabase } from '../supabaseServer';
const supabase = getServerSupabase();

export async function generateCanonicalTitleLLM(articleIds: string[]): Promise<string | null> {
  if (!articleIds.length) return null;
  const { data: arts } = await supabase
    .from('articles')
    .select('title, content_text')
    .in('id', articleIds);
  const items = (arts || []).map((a: any, i: number) => `#${i + 1} ${a.title}\n${(a.content_text || '').slice(0, 400)}`).join('\n\n');
  const prompt = `Create a NEUTRAL canonical event title (8–12 words) that best represents the combined news below. Avoid adjectives and opinion; focus on entities and action. Return ONLY the title text.\n\n${items}`;
  try {
    const response = await chatCompletion({
      messages: [
        { role: 'system', content: 'You write neutral, factual canonical titles for combined news events.' },
        { role: 'user', content: prompt },
      ],
      // Note: gpt-5-mini only supports temperature=1 (default)
      max_completion_tokens: 60,
    });
    const title = response.trim().replace(/^"|"$/g, '');
    return title || null;
  } catch {
    return null;
  }
}

