# Embedding Dimension Migration Guide

## Problem
Your database is configured for 1536-dimension embeddings (text-embedding-ada-002), but you're now using text-embedding-3-large which produces 3072 dimensions.

**Error:**
```
expected 1536 dimensions, not 3072
```

## Solution

### Option 1: Apply Migration via Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/rqyknbyloifjuztbcmjc
   - Navigate to: **SQL Editor**

2. **Run the Migration**
   - Copy the contents of `/lib/migrations/20251011_update_embedding_dimensions.sql`
   - Paste into SQL Editor
   - Click **Run**

3. **Verify**
   - Run this query to verify the change:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'articles' AND column_name = 'embedding';
   ```
   - You should see: `vector(3072)`

### Option 2: Apply via Command Line (If you have Supabase CLI)

```bash
# Navigate to project directory
cd /Users/patu/DEV/002-Research/002-ai-new

# Apply migration
supabase db push --db-url "postgresql://postgres:[password]@db.rqyknbyloifjuztbcmjc.supabase.co:5432/postgres" \
  --file lib/migrations/20251011_update_embedding_dimensions.sql
```

## What the Migration Does

1. **Drops old embedding column** (1536 dimensions)
2. **Creates new embedding column** (3072 dimensions)
3. **Creates HNSW index** for similarity search (instead of ivfflat)
4. **Adds documentation comment**

### Why HNSW Instead of IVFFlat?

**Important**: Supabase's `ivfflat` index has a **2000 dimension limit**. Since `text-embedding-3-large` produces 3072 dimensions, we must use **HNSW** (Hierarchical Navigable Small World) index instead.

**Benefits of HNSW**:
- ✅ Supports high-dimensional vectors (3072+)
- ✅ Better query performance for similarity search
- ✅ More accurate results
- ✅ Scales better with large datasets

## Important Notes

⚠️ **WARNING**: This migration will **delete existing embeddings**. All articles will need to be re-embedded.

After migration:
- Existing embeddings will be lost
- The pipeline will automatically re-embed all articles on next run
- This is expected behavior when changing embedding models

## Alternative: Keep Both Dimensions (Not Recommended)

If you want to keep using ada-002 (1536 dimensions), update `.env.local`:

```env
AZURE_EMBED_MODEL=text-embedding-ada-002
AZURE_EMBED_API_VERSION=2023-05-15
```

**However, text-embedding-3-large provides better quality**, so the migration is recommended.

## Verification After Migration

1. **Run the pipeline**:
   ```bash
   npm run dev
   # Visit: http://localhost:3000/admin/sync
   # Click "Run Complete Pipeline Now"
   ```

2. **Check for errors**:
   - Should no longer see "expected 1536 dimensions" errors
   - Stage 1 (Embeddings) should complete successfully

3. **Verify database**:
   ```sql
   SELECT COUNT(*) FROM articles WHERE embedding IS NOT NULL;
   ```

## Rollback (If Needed)

If you need to rollback to 1536 dimensions:

```sql
ALTER TABLE articles DROP COLUMN IF EXISTS embedding;
ALTER TABLE articles ADD COLUMN embedding vector(1536);
CREATE INDEX articles_embedding_idx ON articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

Then update `.env.local` to use ada-002 model.

---

**Status**: Migration file created ✅
**Next Step**: Apply migration via Supabase SQL Editor
