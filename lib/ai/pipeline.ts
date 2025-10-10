/**
 * Complete AI Pipeline
 * Orchestrates all AI stages: embedding, clustering, summarization, bias detection
 */

import { embedNewArticles } from './embeddings';
import { clusterNewArticles } from './clustering';
import { summarizeNewEvents } from './summarize';
import { detectBiasForAllEvents } from './bias';
import { classifyNewEvents } from './classify';
import { dedupeRecentEvents } from './dedupe';
import { getServerSupabase } from '../supabaseServer';
const supabase = getServerSupabase();

export interface PipelineResults {
  embeddings: { processed: number; failed: number };
  clustering: { articlesProcessed: number; clustersCreated: number; eventsCreated: number };
  summarization: { eventsProcessed: number; summariesCreated: number; failed: number };
  bias: { eventsProcessed: number; articlesAnalyzed: number; failed: number };
  duration: number;
}

/**
 * Run complete AI pipeline
 */
export async function runCompletePipeline(): Promise<PipelineResults> {
  console.log('🚀 Starting complete AI pipeline...');
  const startTime = Date.now();

  const results: PipelineResults = {
    embeddings: { processed: 0, failed: 0 },
    clustering: { articlesProcessed: 0, clustersCreated: 0, eventsCreated: 0 },
    summarization: { eventsProcessed: 0, summariesCreated: 0, failed: 0 },
    bias: { eventsProcessed: 0, articlesAnalyzed: 0, failed: 0 },
    duration: 0,
  };

  try {
    // Stage 1: Embed new articles
    console.log('\n📊 Stage 1: Computing embeddings...');
    results.embeddings = await embedNewArticles();
    console.log(`✅ Embeddings: ${results.embeddings.processed} processed, ${results.embeddings.failed} failed`);

    // Stage 2: Cluster articles into events
    console.log('\n🔄 Stage 2: Clustering articles...');
    results.clustering = await clusterNewArticles();
    console.log(`✅ Clustering: ${results.clustering.eventsCreated} events created from ${results.clustering.articlesProcessed} articles`);

    // Stage 3: Generate summaries
    console.log('\n📝 Stage 3: Generating summaries...');
    results.summarization = await summarizeNewEvents();
    console.log(`✅ Summarization: ${results.summarization.summariesCreated} summaries for ${results.summarization.eventsProcessed} events`);

    // Stage 4: Detect bias
    console.log('\n⚖️ Stage 4: Detecting bias...');
    results.bias = await detectBiasForAllEvents();
    console.log(`✅ Bias detection: ${results.bias.articlesAnalyzed} articles analyzed`);

    results.duration = Date.now() - startTime;
    console.log(`\n🎉 Pipeline completed in ${(results.duration / 1000).toFixed(2)} seconds`);

    return results;
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    results.duration = Date.now() - startTime;
    throw error;
  }
}

/**
 * Log pipeline results to database
 */
export async function logPipelineResults(results: PipelineResults): Promise<void> {
  const { data: run } = await supabase
    .from('pipeline_runs')
    .insert({
      status: 'completed',
      embeddings_processed: results.embeddings.processed,
      embeddings_failed: results.embeddings.failed,
      articles_clustered: results.clustering.articlesProcessed,
      events_created: results.clustering.eventsCreated,
      summaries_generated: results.summarization.summariesCreated,
      bias_analyzed: results.bias.articlesAnalyzed,
      duration_ms: results.duration,
    })
    .select()
    .single();

  if (run) {
    console.log(`📝 Pipeline run logged: ${run.id}`);
  } else {
    console.error('Failed to log pipeline results');
  }
}
    // Stage 5: Classify categories and newsworthiness
    console.log('\n🗂️ Stage 5: Classifying events...');
    const classRes = await classifyNewEvents();
    console.log(`✅ Classification: ${classRes.categoriesAssigned} categories; ${classRes.nonNewsFlagged} flagged non-news`);

    // Stage 6: Deduplicate recent events
    console.log('\n🧹 Stage 6: Deduplicating events...');
    const dedupeRes = await dedupeRecentEvents(0.84, 200);
    console.log(`✅ Deduplication: merged ${dedupeRes.merged} out of ${dedupeRes.checked} checked`);
