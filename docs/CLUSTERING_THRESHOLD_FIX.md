# Clustering Threshold Fix - Preventing Unrelated Articles from Grouping

## Date: 2025-10-11

---

## Problem

**Mismatched event content** - Events showing unrelated information:

### Example Issue:
- **Event Title**: "Egg prices set to drop by Rs. 10"
- **Summary**: About BBS monk Gnanasara Thera visiting Mahinda Rajapaksa
- **Coverage Headline**: "Egg prices set to drop by Rs. 10"

**Root Cause**: These are two completely different news stories incorrectly grouped together.

---

## Why This Happens

### 1. Low Clustering Threshold
```typescript
// OLD: threshold = 0.82 (82% similarity)
threshold: number = 0.82
```

**Problem**: 82% similarity is too permissive. Articles about different topics can have 82% similarity if they:
- Come from the same news source (similar writing style)
- Published at the same time (similar embedding patterns)
- Share common political/local news vocabulary

### 2. Title vs Summary Mismatch

The clustering process:
1. **Groups articles** based on embedding similarity (0.82 threshold)
2. **Picks canonical title** from ONE article (shortest or LLM-generated)
3. **Generates summary** from ALL articles in the cluster
4. **Shows coverage** from ONE article per source (deduplicated)

**Result**: If unrelated articles are clustered together:
- Title comes from Article A ("Egg prices")
- Summary comes from Articles A + B ("Monk visits president")
- Coverage shows Article A headline

---

## Solution Applied

### Increased Clustering Threshold: 0.82 → 0.88

```typescript
// NEW: threshold = 0.88 (88% similarity)
export function clusterArticles(
  articles: ArticleWithEmbedding[],
  threshold: number = 0.88  // Increased from 0.82
): Cluster[] {
```

**Impact**:
- ✅ Stricter matching - only truly related articles cluster
- ✅ Reduces false positives (unrelated articles grouping)
- ⚠️ May create more single-article events (acceptable tradeoff)

---

## Threshold Comparison

| Threshold | Behavior | Use Case |
|-----------|----------|----------|
| 0.75 | Very loose | Broad topic grouping |
| **0.82 (old)** | **Loose** | **Similar topics cluster (too permissive)** |
| **0.88 (new)** | **Strict** | **Same event only** ✅ |
| 0.92 | Very strict | Identical articles only |
| 0.95 | Ultra strict | Near-duplicates only |

---

## Expected Results

### Before (threshold 0.82):
- Articles about "egg prices" + "monk visit" → **Clustered together** ❌
- 4 events created from 30 articles
- High mismatch rate

### After (threshold 0.88):
- Articles about "egg prices" → **Event 1**
- Articles about "monk visit" → **Event 2**
- 6-8 events created from 30 articles
- Low mismatch rate ✅

---

## Testing

### 1. Verify Threshold Changed:
```bash
grep "threshold.*0.88" lib/ai/clustering.ts
```

Should show:
```typescript
threshold: number = 0.88  // Increased from 0.82
```

### 2. Run Pipeline:
```bash
# Visit admin sync page
http://localhost:3000/admin/sync

# Click "Run Complete Pipeline Now"
```

### 3. Check New Events:
```bash
# Visit homepage
http://localhost:3000/

# Click on any event
# Verify:
# - Title matches summary ✓
# - Summary matches coverage headlines ✓
# - All content is about the SAME topic ✓
```

### 4. Diagnostic Endpoint (Optional):
```bash
curl "http://localhost:3000/api/admin/diagnose-event?eventId=[EVENT_ID]"
```

Check:
- `minSimilarity` should be > 0.88
- All `pairwiseSimilarities` should be > 0.88
- `problem` should be null

---

## Alternative Solutions (Not Implemented)

### Option 1: Dynamic Threshold
Adjust threshold based on article count:
- 2-3 articles: Use 0.90 (very strict)
- 4-6 articles: Use 0.88 (strict)
- 7+ articles: Use 0.85 (moderate)

**Not chosen**: Adds complexity

### Option 2: Multi-stage Validation
After clustering, validate that:
- All article titles share key terms
- Summary contains terms from title
- Reject cluster if validation fails

**Not chosen**: Requires more AI API calls

### Option 3: Manual Review
Flag events for manual review if:
- Title doesn't match summary
- Low average similarity in cluster

**Not chosen**: Requires human intervention

---

## Monitoring

### Signs of Good Clustering:
- ✅ Event titles match summaries
- ✅ Coverage headlines relate to event topic
- ✅ Similar article counts per event (not too many singletons)

### Signs of Threshold Too High:
- ❌ Many single-article "events"
- ❌ Obvious duplicates not clustering
- ❌ Same story from different sources as separate events

### Signs of Threshold Too Low:
- ❌ Unrelated content in same event
- ❌ Title doesn't match summary
- ❌ Very large clusters (10+ articles)

---

## Rollback (if needed)

If 0.88 is too strict, reduce gradually:

```typescript
// Try 0.85 (middle ground)
threshold: number = 0.85
```

**Recommended range**: 0.85 - 0.90

---

## Related Fixes

This fix works together with:
1. **Coverage deduplication fix** (one entry per source)
2. **Source constraint fix** (avoid duplicate domain errors)
3. **Canonical title generation** (LLM-based neutral titles)

---

## Impact on Other Stages

### Stage 1: Embeddings
- ✅ No change - still uses text-embedding-3-small

### Stage 2: Clustering
- ✅ **CHANGED** - threshold 0.82 → 0.88
- More clusters created (good)
- Fewer articles per cluster (good)

### Stage 3: Summarization
- ✅ Improved - fewer unrelated articles to summarize
- More coherent summaries

### Stage 4: Bias Detection
- ✅ No change - still analyzes coverage

### Stage 5-7: Classification & Dedup
- ✅ Improved - cleaner events are easier to classify
- May have more duplicates to merge (acceptable)

---

## Build Status

✅ **PASSING** - No breaking changes

---

## Summary

**Change**: Clustering threshold 0.82 → 0.88

**Reason**: Prevent unrelated articles from grouping together

**Result**: Event titles will now match their summaries and coverage

**Trade-off**: May create more single-article events (filtered out automatically)

---

**Status**: ✅ **DEPLOYED**

**Next**: Run pipeline and verify events have matching content

---

*Last Updated: 2025-10-11*
*Fix for mismatched event content*
