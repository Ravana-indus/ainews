import Parser from 'rss-parser';

export type RssItem = { title: string; link: string; pubDate: string };

export type RssDiagnostics = {
  items: RssItem[];
  logs: string[];
  errors: string[];
  xmlPreview?: string;
};

const parser = new Parser({
  timeout: 10000,
  headers: {
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
    'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
  },
});

export async function fetchRssItems(feedUrl: string, limit: number = 10): Promise<RssItem[]> {
  const result = await fetchRssItemsWithDiagnostics(feedUrl, limit);
  return result.items;
}

export async function fetchRssItemsWithDiagnostics(feedUrl: string, limit: number = 10): Promise<RssDiagnostics> {
  const logs: string[] = [];
  const errors: string[] = [];

  try {
    logs.push(`Starting RSS fetch for: ${feedUrl}`);
    logs.push('Using rss-parser library...');

    const feed = await parser.parseURL(feedUrl);

    logs.push(`Feed title: ${feed.title || 'N/A'}`);
    logs.push(`Feed description: ${feed.description || 'N/A'}`);
    logs.push(`Total items in feed: ${feed.items?.length || 0}`);

    const items: RssItem[] = [];

    if (!feed.items || feed.items.length === 0) {
      errors.push('No items found in feed');
      return { items: [], logs, errors };
    }

    for (let i = 0; i < feed.items.length && items.length < limit; i++) {
      const item = feed.items[i];

      const title = item.title?.trim();
      const link = item.link?.trim() || item.guid?.trim();
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString();

      if (i === 0) {
        logs.push(`First item sample:`);
        logs.push(`  Title: ${title || 'MISSING'}`);
        logs.push(`  Link: ${link || 'MISSING'}`);
        logs.push(`  PubDate: ${pubDate}`);
      }

      if (title && link) {
        items.push({ title, link, pubDate });
        logs.push(`Parsed item ${i + 1}: "${title.substring(0, 60)}..."`);
      } else {
        logs.push(`Skipped item ${i + 1} - title: ${title ? 'OK' : 'MISSING'}, link: ${link ? 'OK' : 'MISSING'}`);
      }
    }

    logs.push(`Total items parsed: ${items.length}`);

    if (items.length === 0) {
      errors.push('No valid items could be parsed from feed');
    }

    return { items, logs, errors };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    errors.push(`RSS parse exception: ${errMsg}`);
    logs.push(`Fatal error: ${errMsg}`);
    return { items: [], logs, errors };
  }
}
