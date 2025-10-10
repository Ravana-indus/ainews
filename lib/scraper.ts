import * as cheerio from 'cheerio';

export type ScrapedArticle = {
  title: string;
  url: string;
  content: string;
  publishedAt?: string;
  author?: string;
};

export type ScraperDiagnostics = {
  article: ScrapedArticle | null;
  logs: string[];
  errors: string[];
};

/**
 * Scrape an article from a URL using Cheerio
 */
export async function scrapeArticle(url: string): Promise<ScrapedArticle | null> {
  const result = await scrapeArticleWithDiagnostics(url);
  return result.article;
}

export async function scrapeArticleWithDiagnostics(url: string): Promise<ScraperDiagnostics> {
  const logs: string[] = [];
  const errors: string[] = [];

  try {
    logs.push(`Starting scrape for: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
      },
    });

    if (!response.ok) {
      errors.push(`HTTP error: ${response.status} ${response.statusText}`);
      return { article: null, logs, errors };
    }

    const html = await response.text();
    logs.push(`HTML received: ${html.length} bytes`);

    const $ = cheerio.load(html);

    // Try multiple strategies to extract content
    let title = '';
    let content = '';
    let publishedAt = '';
    let author = '';

    // Extract title (try multiple selectors)
    title = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('h1').first().text() ||
            $('title').text() ||
            '';
    title = title.trim();
    logs.push(`Title extracted: ${title ? `"${title.substring(0, 60)}..."` : 'MISSING'}`);

    // Extract author
    author = $('meta[name="author"]').attr('content') ||
             $('meta[property="article:author"]').attr('content') ||
             $('.author').first().text() ||
             $('[rel="author"]').first().text() ||
             '';
    author = author.trim();

    // Extract published date
    publishedAt = $('meta[property="article:published_time"]').attr('content') ||
                  $('meta[name="publishdate"]').attr('content') ||
                  $('time').attr('datetime') ||
                  '';

    // Extract main content (try multiple strategies)
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '[itemprop="articleBody"]',
      'main',
      '.content',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Remove unwanted elements
        element.find('script, style, nav, header, footer, .advertisement, .ad, .social-share').remove();

        // Get text content
        const text = element.text().trim();
        if (text.length > content.length) {
          content = text;
        }
      }
    }

    // Fallback: extract all paragraphs
    if (!content || content.length < 100) {
      logs.push('Using fallback: extracting all paragraphs');
      const paragraphs: string[] = [];
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
      content = paragraphs.join('\n\n');
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
      .substring(0, 5000); // Limit to 5000 chars

    logs.push(`Content extracted: ${content.length} characters`);
    logs.push(`Author: ${author || 'N/A'}`);
    logs.push(`Published: ${publishedAt || 'N/A'}`);

    if (!title || !content) {
      errors.push(`Incomplete extraction - title: ${!!title}, content: ${!!content}`);
      return { article: null, logs, errors };
    }

    const article: ScrapedArticle = {
      title,
      url,
      content,
      publishedAt: publishedAt || new Date().toISOString(),
      author,
    };

    return { article, logs, errors };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    errors.push(`Scrape exception: ${errMsg}`);
    logs.push(`Fatal error: ${errMsg}`);
    return { article: null, logs, errors };
  }
}

export type LinkItem = { title: string; link: string; pubDate: string };
export type LinkDiagnostics = { items: LinkItem[]; logs: string[]; errors: string[] };

/**
 * Fetch latest article links from a domain homepage or /news path
 * Heuristics-based; used when RSS is unavailable.
 */
export async function fetchLatestLinksFromDomain(domain: string, limit: number = 3): Promise<LinkDiagnostics> {
  const logs: string[] = [];
  const errors: string[] = [];
  const items: LinkItem[] = [];

  function makeUrl(path: string) {
    const base = `https://${domain.replace(/^https?:\/\//, '')}`;
    return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  const candidates = [makeUrl('/news'), makeUrl('/')];
  for (const url of candidates) {
    try {
      logs.push(`Probing domain page: ${url}`);
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' } });
      const html = await res.text();
      const $ = cheerio.load(html);
      const seen = new Set<string>();

      $('a').each((_, el) => {
        const href = ($(el).attr('href') || '').trim();
        let text = ($(el).text() || '').trim();
        if (!href || href.startsWith('#')) return;
        const abs = makeUrl(href);
        try {
          const u = new URL(abs);
          if (!u.hostname.includes(domain.replace(/^www\./, ''))) return; // internal links only
          if (seen.has(u.href)) return;
          // Heuristics: ignore obvious navigation paths
          if (/\.(jpg|png|gif|svg|pdf)$/i.test(u.pathname)) return;
          if (/\b(tag|category|about|contact|privacy|terms)\b/i.test(u.pathname)) return;
          // Prefer likely article paths
          const looksLikeArticle = /\b(news|article|202[0-9]|story)\b/i.test(u.pathname);
          if (!looksLikeArticle) return;
          if (text.length < 20) text = $('title').text() || u.pathname;
          items.push({ title: text.slice(0, 160), link: u.href, pubDate: new Date().toISOString() });
          seen.add(u.href);
        } catch {}
      });
      logs.push(`Found ${items.length} candidate links on ${url}`);
      if (items.length >= limit) break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to load ${url}: ${msg}`);
    }
  }

  return { items: items.slice(0, limit), logs, errors };
}
