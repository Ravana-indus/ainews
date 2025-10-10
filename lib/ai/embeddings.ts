/**
 * Article Embedding Service
 * Computes and stores vector embeddings for articles using Azure OpenAI
 */

import { getEmbedding } from './azure';
import { getServerSupabase } from '../supabaseServer';
const supabase = getServerSupabase();

export interface Article {
  id: string;
  title: string;
  content_text: string;
  embedding?: number[];
}

/**
 * Compute embedding for an article
 * Combines title and content for better semantic representation
 */
export async function computeArticleEmbedding(article: Article): Promise<number[]> {
  // Combine title (3x weight) and content for embedding
  const text = `${article.title} ${article.title} ${article.title} ${article.content_text}`.substring(0, 8000);

  try {
    const embedding = await getEmbedding(text);
    return embedding;
  } catch (error) {
    console.error(`Failed to compute embedding for article ${article.id}:`, error);
    throw error;
  }
}

/**
 * Store embedding in database
 */
export async function storeArticleEmbedding(articleId: string, embedding: number[]): Promise<void> {
  const { error } = await supabase
    .from('articles')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', articleId);

  if (error) {
    console.error(`Failed to store embedding for article ${articleId}:`, error);
    throw error;
  }
}

/**
 * Compute and store embeddings for all articles without embeddings
 */
export async function embedNewArticles(): Promise<{ processed: number; failed: number }> {
  // Fetch articles without embeddings
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content_text, embedding')
    .is('embedding', null)
    .limit(50); // Process in batches to avoid timeout

  if (error || !articles) {
    console.error('Failed to fetch articles for embedding:', error);
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const article of articles) {
    try {
      const embedding = await computeArticleEmbedding(article);
      await storeArticleEmbedding(article.id, embedding);
      processed++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to embed article ${article.id}:`, error);
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find similar articles using pgvector cosine similarity
 */
export async function findSimilarArticles(
  articleId: string,
  threshold: number = 0.82,
  limit: number = 10
): Promise<Array<{ id: string; similarity: number }>> {
  // Get the article's embedding
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('id, embedding')
    .eq('id', articleId)
    .single();

  if (articleError || !article || !article.embedding) {
    return [];
  }

  // Use pgvector for efficient similarity search
  // Note: This requires pgvector extension to be enabled in Supabase
  const { data: similar, error: similarError } = await supabase.rpc('find_similar_articles', {
    query_embedding: article.embedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (similarError) {
    console.error('Error finding similar articles:', similarError);
    return [];
  }

  return similar || [];
}
