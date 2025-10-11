-- Migration: Update embedding dimensions from 1536 to 3072
-- Reason: Migrating from text-embedding-ada-002 (1536) to text-embedding-3-large (3072)
-- Date: 2025-10-11
-- Note: Using HNSW index instead of ivfflat because ivfflat has 2000 dimension limit

-- Step 1: Drop the existing embedding column and index
DROP INDEX IF EXISTS articles_embedding_idx;
ALTER TABLE articles DROP COLUMN IF EXISTS embedding;

-- Step 2: Add the new embedding column with 3072 dimensions
ALTER TABLE articles ADD COLUMN embedding vector(3072);

-- Step 3: Create HNSW index for vector similarity search
-- HNSW (Hierarchical Navigable Small World) supports high dimensions and provides better performance
CREATE INDEX articles_embedding_idx ON articles USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN articles.embedding IS 'Article embedding using text-embedding-3-large model (3072 dimensions, HNSW index)';
