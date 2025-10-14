import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { getPageText } from '../../../lib/content';

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  const eventId = '4de584ef-e277-4a53-ab38-af4a95d6d605';

  // Fetch articles for this event
  const { data: evArts } = await supabase
    .from('event_articles')
    .select('article_id')
    .eq('event_id', eventId);

  const articleIds = (evArts || []).map((e: any) => e.article_id);

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, content_text, url, source_id')
    .in('id', articleIds);

  if (!articles) {
    return NextResponse.json({ error: 'No articles found' });
  }

  // Test content fetching
  const contentTests = [];
  for (const article of articles) {
    let content = article.content_text || '';
    let fetched = null;
    let error = null;

    if (!content || content.length < 200) {
      try {
        fetched = await getPageText(article.url);
        content = fetched || content;
      } catch (e: any) {
        error = e.message;
      }
    }

    contentTests.push({
      id: article.id,
      title: article.title,
      url: article.url,
      originalContentLength: (article.content_text || '').length,
      finalContentLength: content.length,
      contentPreview: content.substring(0, 300),
      fetchedNewContent: !!fetched,
      fetchError: error,
    });
  }

  return NextResponse.json({
    eventId,
    articleCount: articles.length,
    contentTests,
  });
}
