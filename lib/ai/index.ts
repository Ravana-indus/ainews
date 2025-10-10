/**
 * AI Services Index
 * Main exports for all AI functionality
 */

// Core Azure OpenAI integration
export { chatCompletion, getEmbedding, getAzureConfig } from './azure';

// Embedding and vector operations
export {
  computeArticleEmbedding,
  storeArticleEmbedding,
  embedNewArticles,
  cosineSimilarity,
  findSimilarArticles
} from './embeddings';

// Clustering and event creation
export {
  clusterNewArticles,
  fetchUnclusteredArticles,
  clusterArticles,
  saveClusterAsEvent
} from './clustering';

// Summarization and translation
export {
  generateNeutralSummary,
  summarizeEventInAllLanguages,
  summarizeNewEvents,
  saveSummaries
} from './summarize';

// Bias detection
export {
  analyzeBias,
  detectBiasForEvent,
  detectBiasForAllEvents
} from './bias';

// Complete pipeline
export {
  runCompletePipeline,
  logPipelineResults
} from './pipeline';

// Type exports
export type {
  AzureConfig,
  ChatMessage,
  ChatCompletionRequest
} from './azure';

export type {
  ArticleWithEmbedding,
  Cluster
} from './clustering';

export type {
  Article
} from './embeddings';

export type {
  ArticleForSummary,
  EventSummary
} from './summarize';

export type {
  BiasAnalysis
} from './bias';

export type {
  PipelineResults
} from './pipeline';