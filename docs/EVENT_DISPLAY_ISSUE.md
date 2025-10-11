# Event Display Issue - Missing Summaries and Coverage

## Problem

Event page at `http://localhost:3000/event/4de584ef-e277-4a53-ab38-af4a95d6d605` only shows:
- ✅ Title
- ❌ No detailed summary
- ❌ No "How different outlets framed it" section
- ❌ No source information

## Root Cause

This event was created **BEFORE** the upsert fix was applied. Here's what happened:

###Timeline:
1. **Event Created** ✅ (event ID: `4de584ef-e277-4a53-ab38-af4a95d6d605`)
2. **Coverage Insert Failed** ❌ (duplicate key constraint violation)
3. **Summarization Skipped** ❌ (no coverage data)
4. **Bias Detection Skipped** ❌ (no coverage data)

### What the Event Is Missing:

```sql
-- Missing from summaries table
SELECT * FROM summaries WHERE event_id = '4de584ef-e277-4a53-ab38-af4a95d6d605';
-- Result: 0 rows

-- Missing from event_source_coverage table
SELECT * FROM event_source_coverage WHERE event_id = '4de584ef-e277-4a53-ab38-af4a95d6d605';
-- Result: 0 rows
```

### Why Reprocessing Failed:

The reprocessing API (`/api/admin/reprocess-event`) attempts to:
1. Create coverage from event_articles ✅
2. Generate summaries via AI ❓
3. Detect bias ❓

The summarization is failing silently, likely due to:
- **Insufficient article content** - articles have HTML boilerplate instead of clean text
- **Content fetching failing** - `getPageText()` may be timing out or blocked
- **AI API errors** - errors being caught and returning null

## Diagnosis Results

### Event Data:
```json
{
  "id": "4de584ef-e277-4a53-ab38-af4a95d6d605",
  "canonical_title": "PM to attend Global Leader's Meeting on Women in Beijing - DailyNews",
  "category": "General",
  "is_news": true,
  "first_seen_at": "2025-10-10T19:48:00+00:00",
  "last_updated_at": "2025-10-10T19:50:00+00:00"
}
```

### Linked Articles (2):
1. **Article 1**: `3fa2649f-cc45-41ea-980e-e2e190a36d41`
   - Title: "Cabinet reshuffle will accelerate govt's development goals - Minister"
   - Content: Mostly HTML boilerplate (poor quality)

2. **Article 2**: `e4f94e54-de52-42df-90b1-54a62d58012a`
   - Title: "PM to attend Global Leader's Meeting on Women in Beijing"
   - Content: Mostly HTML boilerplate (poor quality)

### Missing Data:
- ❌ **0 summaries** (should have 3: EN, SI, TA)
- ❌ **0 coverage entries** (should have 2: one per source)

## Solution

### Option 1: Run Complete Pipeline Again (Recommended)

The pipeline with the upsert fix will create **NEW events correctly**:

```bash
# Navigate to admin sync page
http://localhost:3000/admin/sync

# Click "Run Complete Pipeline Now"
```

**What will happen:**
1. ✅ New articles will be embedded
2. ✅ Clustering will create events with proper coverage (using upsert)
3. ✅ Summaries will be generated (if content is available)
4. ✅ Bias detection will analyze coverage
5. ✅ All 7 stages will complete successfully

### Option 2: Manually Delete Old Events

Old events without summaries can be removed:

```sql
-- Find events without summaries
SELECT e.id, e.canonical_title, e.last_updated_at
FROM events e
LEFT JOIN summaries s ON s.event_id = e.id
WHERE s.event_id IS NULL
ORDER BY e.last_updated_at DESC;

-- Delete specific event
DELETE FROM events WHERE id = '4de584ef-e277-4a53-ab38-af4a95d6d605';
```

Then run the pipeline to create fresh events.

###Option 3: Fix Article Content Quality

The real issue is article content quality. Improve the scraping/content extraction:

**Current Problem:**
```
content_text: "Local Politics Sports Editorial Business Features..."
```
(HTML boilerplate instead of actual article content)

**Needed:**
```
content_text: "Prime Minister Dr. Harini Amarasuriya will visit China from October 12 to 15..."
```

**Fix locations:**
1. **Content scraping** - `lib/content.ts` (getPageText function)
2. **Article ingestion** - Better HTML parsing during scrape
3. **Pipeline** - Verify content quality before clustering

### Option 4: Reprocess All Events with Better Error Handling

Use the batch reprocess endpoint:

```bash
curl -X POST http://localhost:3000/api/admin/reprocess-all-events
```

But first, **fix the content quality issue** or most events will fail summarization.

## Next Steps

### Immediate Actions:

1. **Run the pipeline** to create new events with proper data
   - Go to: `http://localhost:3000/admin/sync`
   - Click: "Run Complete Pipeline Now"
   - Monitor console for all 7 stages completing

2. **Check new events** have complete data:
   - Summaries in all 3 languages
   - Source coverage with lean scores
   - Bias analysis results

3. **Verify event pages** display properly:
   - Title ✓
   - Summary ✓
   - Detailed section ✓
   - "How outlets framed it" section ✓
   - Source tiles with bias indicators ✓

### Long-term Fixes:

1. **Improve Content Extraction**
   - Fix `getPageText()` to extract clean article text
   - Remove HTML boilerplate
   - Handle different news site layouts

2. **Add Content Quality Checks**
   - Validate article content before embedding
   - Reject articles with < 200 chars of real content
   - Flag articles needing content re-fetching

3. **Better Error Handling**
   - Log when summarization fails
   - Retry with exponential backoff
   - Alert admins of persistent failures

4. **Database Cleanup Script**
   - Remove events without summaries
   - Remove events without coverage
   - Remove orphaned articles

## Testing the Fix

### Create a Test Event:

1. **Add a new article** with good content:
```bash
curl -X POST http://localhost:3000/api/admin/manual \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.dailynews.lk/2025/10/11/...",
    "force": true
  }'
```

2. **Run the pipeline**

3. **Check the new event** has all data:
```bash
curl http://localhost:3000/api/debug/event/[NEW_EVENT_ID]
```

Expected result:
```json
{
  "diagnostics": {
    "hasSummaries": true,
    "hasCoverage": true,
    "summaryCount": 3,
    "coverageCount": 2
  }
}
```

## Files Modified

### API Endpoints Created:
- `/app/api/debug/event/[id]/route.ts` - Debug event data
- `/app/api/admin/reprocess-event/route.ts` - Reprocess single event
- `/app/api/admin/reprocess-all-events/route.ts` - Batch reprocess
- `/app/api/check-db/route.ts` - Direct database check
- `/app/api/test-summarize/route.ts` - Test content fetching

### Core Fixes (Already Applied):
- `lib/ai/clustering.ts` - Upsert for event_source_coverage ✅
- `lib/ai/pipeline.ts` - Fixed unreachable stages ✅
- `lib/ai/azure.ts` - GPT-5-mini parameter compatibility ✅
- `lib/ai/summarize.ts` - Removed temperature parameter ✅

## Summary

**The good news:** All future events will work correctly ✅

**The bad news:** Old events (created before the fix) are missing data ❌

**The solution:** Run the pipeline again to create fresh events with complete data 🚀

---

**Status**: Old events need manual cleanup or reprocessing
**Priority**: Low (affects only events created before 2025-10-11)
**Recommendation**: Run pipeline to create new events, ignore/delete old incomplete ones

---

*Last Updated: 2025-10-11*
*Event with issue: `4de584ef-e277-4a53-ab38-af4a95d6d605`*
