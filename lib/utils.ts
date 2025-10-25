import type { LanguageCode } from './mocks';

/**
 * Helper function to extract summary from detailed content
 */
export function extractSummary(content: string, lang?: LanguageCode): string {
  if (!content) return '';

  const firstParagraph = content.split('\n\n')[0];
  const summary = firstParagraph.length > 200
    ? firstParagraph.substring(0, 200) + '...'
    : firstParagraph.trim();

  return summary;
}

/**
 * Helper function to extract source name from URL
 */
export function getSourceNameFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0];
  } catch (e) {
    return 'Unknown Source';
  }
}

/**
 * Helper function to normalize URL for comparison
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Normalize title for similarity comparison
 * Removes special characters, extra spaces, and converts to lowercase
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .trim();
}

/**
 * Calculate similarity between two titles using Jaccard similarity
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const normalized1 = normalizeTitle(title1);
  const normalized2 = normalizeTitle(title2);

  if (!normalized1 || !normalized2) return 0;
  if (normalized1 === normalized2) return 1;

  // Split into words
  const words1 = new Set(normalized1.split(' '));
  const words2 = new Set(normalized2.split(' '));

  // Calculate Jaccard similarity: intersection / union
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Check if two stories are likely duplicates
 */
export function areDuplicateStories(
  story1: { title: string; source_url?: string },
  story2: { title: string; source_url?: string },
  titleSimilarityThreshold: number = 0.8
): boolean {
  // Check URL similarity
  if (story1.source_url && story2.source_url) {
    const url1 = normalizeUrl(story1.source_url.split(',')[0]?.trim() || '');
    const url2 = normalizeUrl(story2.source_url.split(',')[0]?.trim() || '');
    if (url1 && url2 && url1 === url2) {
      return true;
    }
  }

  // Check title similarity
  const titleSimilarity = calculateTitleSimilarity(story1.title, story2.title);
  return titleSimilarity >= titleSimilarityThreshold;
}
