export const revalidate = 0;
import { supabase } from './supabaseClient';
import type { EventItem, LanguageCode } from './mocks';
import { extractSummary, getSourceNameFromUrl, areDuplicateStories } from './utils';

interface FetchOptions {
  category?: string;
  limit?: number;
  sortBy?: 'updated' | 'published' | 'category';
  removeDuplicates?: boolean;
}

export async function fetchEvents(
  _lang: LanguageCode,
  categoryOrOptions?: string | FetchOptions
): Promise<EventItem[]> {
  // Handle both old string parameter and new options object
  let options: FetchOptions = {};
  if (typeof categoryOrOptions === 'string') {
    options = { category: categoryOrOptions };
  } else if (categoryOrOptions) {
    options = categoryOrOptions;
  }

  const {
    category,
    limit,
    sortBy = 'updated',
    removeDuplicates = true
  } = options;

  // Fetch all stories - we'll sort them in memory since updated_at might not exist
  const { data: stories, error: storiesErr } = await supabase
    .from('stories')
    .select('*');

  if (storiesErr) {
    console.error('Error fetching stories:', storiesErr);
    return [];
  }

  if (!stories || stories.length === 0) {
    console.log('No stories found in database');
    return [];
  }

  console.log(`Fetched ${stories.length} stories from database`);

  // Filter by category if provided
  let filteredStories = category
    ? stories.filter((story: any) => story.category === category)
    : stories;

  // Apply duplicate removal if enabled
  if (removeDuplicates) {
    filteredStories = removeDuplicateStories(filteredStories);
  }

  // Sort based on preference
  filteredStories = sortStories(filteredStories, sortBy);

  // Apply limit if provided
  if (limit && limit > 0) {
    filteredStories = filteredStories.slice(0, limit);
  }

  // Map stories to EventItem format
  const result: EventItem[] = filteredStories.map((story: any) =>
    mapStoryToEventItem(story)
  );

  return result;
}

/**
 * Remove duplicate stories based on URL and title similarity
 */
function removeDuplicateStories(stories: any[]): any[] {
  const uniqueStories: any[] = [];
  const duplicateCount: { [key: string]: number } = {};

  for (const story of stories) {
    let isDuplicate = false;

    // Check against all unique stories collected so far
    for (const existingStory of uniqueStories) {
      if (areDuplicateStories(story, existingStory)) {
        isDuplicate = true;
        const key = existingStory.id;
        duplicateCount[key] = (duplicateCount[key] || 1) + 1;

        console.log(
          `Duplicate detected: "${story.title}" is similar to "${existingStory.title}"`
        );
        break;
      }
    }

    if (!isDuplicate) {
      uniqueStories.push(story);
    }
  }

  console.log(`Removed ${stories.length - uniqueStories.length} duplicate stories`);
  if (Object.keys(duplicateCount).length > 0) {
    console.log('Duplicate counts:', duplicateCount);
  }

  return uniqueStories;
}

/**
 * Sort stories based on specified criteria
 */
function sortStories(stories: any[], sortBy: 'updated' | 'published' | 'category'): any[] {
  const sorted = [...stories];

  switch (sortBy) {
    case 'updated':
      // Sort by updated_at (most recent first), fallback to published_at, then created_at
      sorted.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.published_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.published_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      break;

    case 'published':
      // Sort by published_at, fallback to created_at
      sorted.sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at || 0).getTime();
        const dateB = new Date(b.published_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      break;

    case 'category':
      // Sort by category, then by date within each category
      sorted.sort((a, b) => {
        const categoryCompare = (a.category || 'General').localeCompare(b.category || 'General');
        if (categoryCompare !== 0) return categoryCompare;

        const dateA = new Date(a.updated_at || a.published_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.published_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      break;
  }

  console.log(`Sorted ${sorted.length} stories by ${sortBy}`);
  return sorted;
}

/**
 * Map a story from Supabase to EventItem format
 */
function mapStoryToEventItem(story: any): EventItem {
  // Parse bias_analysis if available
  let biasSummary: any[] = [];
  let sources: any[] = [];

  if (story.bias_analysis) {
    try {
      // Parse bias_analysis (currently unused, reserved for future enhancement)
      typeof story.bias_analysis === 'string'
        ? JSON.parse(story.bias_analysis)
        : story.bias_analysis;

      // Create bias summary from bias analysis
      biasSummary = [{
        sourceId: 'bias_analysis',
        score: 0,
        label: 'Neutral 0'
      }];
    } catch (e) {
      console.error('Error parsing bias_analysis:', e);
    }
  }

  // Create source info from source_url
  if (story.source_url) {
    const urls = story.source_url.split(',').map((url: string) => url.trim());
    sources = urls.map((url: string, index: number) => ({
      sourceId: `source_${index}`,
      sourceName: getSourceNameFromUrl(url),
      sourceLogo: null,
      headline: story.title || 'No title',
      lean: 0,
      reason: 'Source coverage',
      url: url.trim(),
      publishedAt: story.published_at,
    }));
  }

  // Use updated_at if available, fallback to published_at, then created_at
  const updatedAt = story.updated_at || story.published_at || story.created_at || new Date().toISOString();

  return {
    id: story.id,
    title: story.title || 'Untitled Story',
    summary: {
      en: extractSummary(story.detailed_content, 'en') || '',
      si: extractSummary(story.detailed_content, 'si') || '',
      ta: extractSummary(story.detailed_content, 'ta') || ''
    },
    detail: {
      en: story.detailed_content || '',
      si: story.detailed_content || '',
      ta: story.detailed_content || ''
    },
    updatedAt,
    confidence: 75,
    category: story.category || 'General',
    sources: sources.slice(0, 4),
    biasSummary: biasSummary,
  };
}

export async function fetchEventById(id: string, _lang: LanguageCode): Promise<EventItem | null> {
  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !story) return null;

  return mapStoryToEventItem(story);
}

/**
 * Fetch stories grouped by category
 */
export async function fetchEventsByCategory(
  lang: LanguageCode
): Promise<{ [category: string]: EventItem[] }> {
  const allStories = await fetchEvents(lang, { removeDuplicates: true, sortBy: 'category' });

  const grouped: { [category: string]: EventItem[] } = {};

  allStories.forEach(story => {
    const category = story.category || 'General';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(story);
  });

  return grouped;
}

/**
 * Get list of all categories with story counts
 */
export async function fetchCategories(): Promise<{ name: string; count: number }[]> {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('category');

  if (error || !stories) return [];

  const categoryCounts: { [key: string]: number } = {};
  stories.forEach((story: any) => {
    const category = story.category || 'General';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
}

export async function fetchSources(): Promise<any[]> {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('source_url')
    .not('source_url', 'is', null);

  if (error || !stories) return [];

  // Extract unique sources from source URLs
  const uniqueSources = new Set<string>();
  stories.forEach((story: any) => {
    if (story.source_url) {
      const urls = story.source_url.split(',').map((url: string) => url.trim());
      urls.forEach((url: string) => {
        const sourceName = getSourceNameFromUrl(url);
        uniqueSources.add(sourceName);
      });
    }
  });

  // Convert to array format expected by frontend
  return Array.from(uniqueSources).map((name: string, index: number) => ({
    id: `source_${index}`,
    name: name,
    domain: name.toLowerCase().replace(/\s+/g, ''),
    language: 'en',
    reliability: 0.8,
    logo_url: null,
  }));
}

export async function fetchKPI(): Promise<{
  articles24h: number;
  eventsCreated: number;
  summariesGenerated: number;
  failures: number;
  avgConfidence: number;
  duplicatesRemoved?: number;
}> {
  try {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get all stories and recent stories
    const [allStoriesRes, recentStoriesRes] = await Promise.all([
      supabase.from('stories').select('*'),
      supabase.from('stories').select('id, published_at, created_at').gte('published_at', since),
    ]);

    if (allStoriesRes.error) {
      console.error('Error fetching all stories for KPI:', allStoriesRes.error);
    }

    const allStories = allStoriesRes.data || [];
    const totalCount = allStories.length;
    const stories24h = (recentStoriesRes.data || []).length;

    console.log(`KPI: Total stories in DB: ${totalCount}, Stories in 24h: ${stories24h}`);

    // Calculate duplicates by comparing with and without duplicate removal
    const uniqueStories = removeDuplicateStories(allStories);
    const duplicatesRemoved = totalCount - uniqueStories.length;

    console.log(`KPI: Unique stories: ${uniqueStories.length}, Duplicates removed: ${duplicatesRemoved}`);

    const failures = 0;
    const avgConfidence = 75; // Default confidence

    return {
      articles24h: stories24h,
      eventsCreated: uniqueStories.length, // Count only unique stories
      summariesGenerated: uniqueStories.length,
      failures,
      avgConfidence,
      duplicatesRemoved,
    };
  } catch (error) {
    console.error('Error in fetchKPI:', error);
    return {
      articles24h: 0,
      eventsCreated: 0,
      summariesGenerated: 0,
      failures: 0,
      avgConfidence: 75,
      duplicatesRemoved: 0,
    };
  }
}

export async function fetchLatestArticles(limit: number = 10): Promise<{
  title: string;
  url: string;
  publishedAt: string;
  sourceId: string;
  sourceName?: string;
  sourceLogo?: string | null;
}[]> {
  const { data: stories, error: storiesErr } = await supabase
    .from('stories')
    .select('id, title, source_url, published_at, updated_at, created_at')
    .limit(limit * 2); // Fetch more since we'll sort in memory

  if (storiesErr || !stories || !stories.length) {
    console.error('Error fetching latest articles:', storiesErr);
    return [];
  }

  // Sort by most recent date
  const sorted = [...stories].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.published_at || a.created_at || 0).getTime();
    const dateB = new Date(b.updated_at || b.published_at || b.created_at || 0).getTime();
    return dateB - dateA;
  }).slice(0, limit);

  return sorted.map((story: any, index: number) => {
    const firstUrl = story.source_url ? story.source_url.split(',')[0].trim() : '';
    return {
      title: story.title || 'Untitled Story',
      url: firstUrl,
      publishedAt: story.updated_at || story.published_at || story.created_at,
      sourceId: `story_${index}`,
      sourceName: firstUrl ? getSourceNameFromUrl(firstUrl) : 'Unknown Source',
      sourceLogo: null,
    };
  });
}
