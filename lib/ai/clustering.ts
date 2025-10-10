/**
 * Article Clustering Service
 * Groups similar articles into events using vector similarity
 */

import { getServerSupabase } from '../supabaseServer';
const supabase = getServerSupabase();
import { cosineSimilarity } from './embeddings';

export interface ArticleWithEmbedding {
  id: string;
  title: string;
  source_id: string;
  url: string;
  published_at: string;
  embedding: number[];
}

export interface Cluster {
  articles: ArticleWithEmbedding[];
  centroid?: number[];
}

/**
 * Fetch articles that need clustering (not yet assigned to an event)
 */
export async function fetchUnclusteredArticles(): Promise<ArticleWithEmbedding[]> {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, source_id, url, published_at, embedding')
    .not('embedding', 'is', null)
    .limit(100);

  if (error || !articles) {
    console.error('Failed to fetch unclustered articles:', error);
    return [];
  }

  // Filter out articles already linked to events (via event_articles)
  const { data: existingMappings } = await supabase
    .from('event_articles')
    .select('article_id')
    .in('article_id', articles.map(a => a.id));

  const mappedIds = new Set((existingMappings || []).map((m: any) => m.article_id));

  return articles
    .filter(a => !mappedIds.has(a.id) && a.embedding)
    .map(a => ({
      ...a,
      embedding: typeof a.embedding === 'string' ? JSON.parse(a.embedding) : a.embedding,
    }));
}

/**
 * Cluster articles using hierarchical clustering with cosine similarity
 */
export function clusterArticles(
  articles: ArticleWithEmbedding[],
  threshold: number = 0.82
): Cluster[] {
  if (articles.length === 0) return [];

  const clusters: Cluster[] = [];
  const assigned = new Set<string>();

  // Sort by publish date (newest first)
  const sorted = [...articles].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  for (const article of sorted) {
    if (assigned.has(article.id)) continue;

    // Find existing cluster that this article is similar to
    let bestCluster: Cluster | null = null;
    let bestSimilarity = 0;

    for (const cluster of clusters) {
      // Calculate similarity to cluster centroid or first article
      const targetEmbedding = cluster.centroid || cluster.articles[0].embedding;
      const similarity = cosineSimilarity(article.embedding, targetEmbedding);

      if (similarity >= threshold && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Add to existing cluster
      bestCluster.articles.push(article);
      // Update centroid
      bestCluster.centroid = computeCentroid(bestCluster.articles);
    } else {
      // Create new cluster
      clusters.push({
        articles: [article],
        centroid: article.embedding,
      });
    }

    assigned.add(article.id);
  }

  // Filter out single-article clusters (no clustering benefit)
  return clusters.filter(c => c.articles.length >= 2);
}

/**
 * Compute centroid (average) of article embeddings
 */
function computeCentroid(articles: ArticleWithEmbedding[]): number[] {
  if (articles.length === 0) return [];

  const dim = articles[0].embedding.length;
  const centroid = new Array(dim).fill(0);

  for (const article of articles) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += article.embedding[i];
    }
  }

  // Average
  for (let i = 0; i < dim; i++) {
    centroid[i] /= articles.length;
  }

  return centroid;
}

/**
 * Generate canonical title for a cluster using most common keywords
 */
export function generateCanonicalTitle(cluster: Cluster): string {
  const titles = cluster.articles.map(a => a.title);

  // Simple approach: use the shortest title that appears most similar to others
  // In production, you'd use LLM to generate a neutral title
  let bestTitle = titles[0];
  let bestScore = 0;

  for (const title of titles) {
    // Score based on length (prefer concise) and appearance order (prefer newer)
    const lengthScore = 1 / (title.length / 50); // Shorter is better
    const score = lengthScore;

    if (score > bestScore) {
      bestScore = score;
      bestTitle = title;
    }
  }

  return bestTitle;
}

/**
 * Save a cluster as an event in the database
 */
export async function saveClusterAsEvent(cluster: Cluster): Promise<string | null> {
  const canonicalTitle = generateCanonicalTitle(cluster);

  // Create event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      canonical_title: canonicalTitle,
      category: 'General', // TODO: Add category detection
      first_seen_at: cluster.articles[cluster.articles.length - 1].published_at,
      last_updated_at: cluster.articles[0].published_at,
      importance_score: Math.min(cluster.articles.length * 10, 100),
      is_news: cluster.articles.length >= 2,
    })
    .select()
    .single();

  if (eventError || !event) {
    console.error('Failed to create event:', eventError);
    return null;
  }

  // Create source coverage (per source/outlet) and link articles to event
  const coverages = cluster.articles.map(article => ({
    event_id: event.id,
    source_id: article.source_id, // outlet/source UUID, not article ID
    headline: article.title,
    url: article.url,
    published_at: article.published_at,
    lean: 0, // Will be computed by bias detection
    reason: '', // Will be filled by bias detection
  }));

  const { error: coverageError } = await supabase
    .from('event_source_coverage')
    .insert(coverages);

  if (coverageError) {
    console.error('Failed to create event coverage:', coverageError);
    return null;
  }

  // Link each article to the event
  const eventArticles = cluster.articles.map(article => ({
    event_id: event.id,
    article_id: article.id,
    similarity: 1.0,
    stance_score: 0,
    lean_reason: 'Clustered',
  }));

  const { error: eventArticlesError } = await supabase
    .from('event_articles')
    .insert(eventArticles);

  if (eventArticlesError) {
    console.error('Failed to link articles to event:', eventArticlesError);
    // Do not fail the whole event; continue
  }

  return event.id;
}

/**
 * Main clustering workflow
 */
export async function clusterNewArticles(): Promise<{
  articlesProcessed: number;
  clustersCreated: number;
  eventsCreated: number;
}> {
  console.log('Starting article clustering...');

  const articles = await fetchUnclusteredArticles();
  console.log(`Found ${articles.length} unclustered articles`);

  if (articles.length === 0) {
    return { articlesProcessed: 0, clustersCreated: 0, eventsCreated: 0 };
  }

  const clusters = clusterArticles(articles);
  console.log(`Created ${clusters.length} clusters`);

  let eventsCreated = 0;
  for (const cluster of clusters) {
    const eventId = await saveClusterAsEvent(cluster);
    if (eventId) {
      eventsCreated++;
      console.log(`Created event ${eventId} with ${cluster.articles.length} articles`);
    }
  }

  return {
    articlesProcessed: articles.length,
    clustersCreated: clusters.length,
    eventsCreated,
  };
}
