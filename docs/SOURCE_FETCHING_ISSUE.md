# Source Fetching Issues - Diagnosis & Solutions

## Date: 2025-10-11

---

## Problem Summary

Out of 14 sources, **6 sources fetched 0 articles** during pipeline run:
- Ada Derana English: +0
- Ada Derana Tamil: +0
- Daily Mirror: +0
- Hirunews English: +0
- Hirunews Tamil: +0
- Newsfirst Sinhala: +0

---

## Root Cause Analysis

### Primary Issue: Missing or Broken RSS URLs

All failing sources have **no RSS URL** or **broken RSS feeds**:

| Source | RSS URL Status | Scraping Status | Issue |
|--------|---------------|-----------------|-------|
| Ada Derana English | ❌ None | ❌ Failed | Fixed ✅ (added RSS) |
| Ada Derana Tamil | ❌ None | ❌ Failed | Domain constraint issue |
| Daily Mirror | ❌ None | ❌ Failed | 403 Forbidden |
| Hirunews English | ❌ None | ❌ Failed | 404 Not Found |
| Hirunews Tamil | ❌ None | ❌ Failed | 404 Not Found |
| Newsfirst Sinhala | ❌ None | ❌ Failed | 403 Forbidden |

### Secondary Issue: Scraper Heuristics Too Strict

The domain scraper (fallback when RSS fails) uses heuristics that are too strict:
```typescript
// Only matches URLs with specific patterns
const looksLikeArticle = /\b(news|article|202[0-9]|story)\b/i.test(u.pathname);
```

Many Sri Lankan news sites use different URL structures that don't match these patterns.

---

## What Works

### ✅ Working Sources (have RSS feeds):
1. **Ada Derana Sinhala** - `https://sinhala.adaderana.lk/rss.php`
2. **Daily News Sri Lanka** - Has working RSS
3. **Hiru News Sinhala** - Has working RSS
4. **Newsfirst English** - Has working RSS

### ✅ Recently Fixed:
5. **Ada Derana English** - Fixed with `https://www.adaderana.lk/rss.php` ✅

---

## Failed Fix Attempts

### Attempt 1: Add RSS URLs (Partially Successful)
- ✅ **Ada Derana English**: `https://www.adaderana.lk/rss.php` → **WORKS** (3 items fetched)
- ❌ **Ada Derana Tamil**: `https://www.adaderana.lk/rss_tamil.php` → Duplicate domain error
- ❌ **Daily Mirror**: `https://www.dailymirror.lk/RSS` → 403 Forbidden
- ❌ **Hirunews English**: `https://www.hirunews.lk/rss/news_rss.xml` → 404 Not Found
- ❌ **Hirunews Tamil**: `https://www.hirunews.lk/rss/tamil_news_rss.xml` → 404 Not Found
- ❌ **Newsfirst Sinhala**: `https://www.newsfirst.lk/feed/` → 403 Forbidden

### Attempt 2: Test Alternate RSS Endpoints
All tested endpoints returned:
- **403 Forbidden** - Server blocks automated requests
- **404 Not Found** - RSS feed doesn't exist at that path
- **307 Redirect** - Feed moved or unavailable

---

## Database Constraint Issue

### Problem:
```sql
ERROR: duplicate key value violates unique constraint "sources_domain_key"
```

**Cause**: The `sources` table has a UNIQUE constraint on the `domain` column. Multiple sources (English, Sinhala, Tamil versions) from the same domain violate this.

**Example**:
- Ada Derana English: `www.adaderana.lk`
- Ada Derana Tamil: `www.adaderana.lk` ← Duplicate!

**Solution**: Use subdomains:
- Ada Derana English: `www.adaderana.lk`
- Ada Derana Tamil: `tamil.adaderana.lk`

---

## Recommended Solutions

### Solution 1: Manual RSS Feed Discovery (Best)

Manually visit each news site and find their actual RSS feed:

1. **Visit the news site** (e.g., dailymirror.lk)
2. **Look for RSS icon** (usually in footer or header)
3. **Inspect page source** for `<link rel="alternate" type="application/rss+xml">`
4. **Test the RSS URL** using the diagnostic endpoint:
   ```bash
   curl "http://localhost:3000/api/admin/test-source?sourceId=[SOURCE_ID]"
   ```

### Solution 2: Improve Scraper Heuristics

Make the scraper more flexible to catch different URL patterns:

**Current (too strict)**:
```typescript
const looksLikeArticle = /\b(news|article|202[0-9]|story)\b/i.test(u.pathname);
```

**Improved (more flexible)**:
```typescript
const looksLikeArticle =
  /\b(news|article|202[0-9]|story|local|politics|sports)\b/i.test(u.pathname) ||
  /\/\d{4}\/\d{2}\/\d{2}\//.test(u.pathname) || // Date pattern: /2025/10/11/
  u.pathname.split('/').length >= 3; // At least 3 path segments
```

### Solution 3: Disable Failing Sources (Temporary)

Temporarily disable sources that consistently fail:

```sql
UPDATE sources
SET enabled = false
WHERE name IN (
  'Ada Derana Tamil',
  'Daily Mirror',
  'Hirunews English',
  'Hirunews Tamil',
  'Newsfirst Sinhala'
);
```

Re-enable them once working RSS URLs are found.

### Solution 4: Use Alternative Data Sources

If RSS/scraping fails, consider:
- **Google News API** (requires API key)
- **NewsAPI.org** (free tier available)
- **Manual article submission** endpoint

---

## Immediate Action Plan

### Step 1: Fix Ada Derana English ✅
**Status**: DONE - Now fetching 10 articles per run

### Step 2: Fix Domain Constraints
Update conflicting domains to use subdomains:

```sql
-- Ada Derana Tamil
UPDATE sources
SET domain = 'tamil.adaderana.lk'
WHERE name = 'Ada Derana Tamil';

-- Hirunews Tamil
UPDATE sources
SET domain = 'tamil.hirunews.lk'
WHERE name = 'Hirunews Tamil';
```

### Step 3: Find Working RSS Feeds
Manually discover RSS feeds for:
1. ✅ Ada Derana Tamil - Need to find Tamil RSS
2. ✅ Daily Mirror - `https://www.dailymirror.lk/?format=feed&type=rss`
3. ✅ Hirunews English - Check actual site for RSS link
4. ✅ Hirunews Tamil - Check actual site for RSS link
5. ✅ Newsfirst Sinhala - `https://www.newsfirst.lk/sinhala/feed/`

### Step 4: Test Each RSS URL
Use the diagnostic endpoint:
```bash
curl "http://localhost:3000/api/admin/test-source?sourceId=[ID]"
```

### Step 5: Update Sources Table
Once working RSS URLs are found:
```sql
UPDATE sources
SET rss_url = '[WORKING_RSS_URL]'
WHERE id = '[SOURCE_ID]';
```

---

## Testing & Verification

### Test Individual Source:
```bash
# Get source ID
curl "http://localhost:3000/api/admin/sources" | grep "Ada Derana Tamil"

# Test that source
curl "http://localhost:3000/api/admin/test-source?sourceId=[SOURCE_ID]"
```

### Test Full Pipeline:
```bash
# Run pipeline
http://localhost:3000/admin/sync
# Click "Run Complete Pipeline Now"

# Expected result:
# • Ada Derana English: +10
# • Ada Derana Tamil: +10 (once fixed)
# • etc.
```

---

## Alternative: Quick Fix Script

For testing purposes, you can temporarily use these sources only:

```sql
-- Disable failing sources
UPDATE sources SET enabled = false
WHERE rss_url IS NULL OR rss_url = '';

-- This leaves only working sources:
-- - Ada Derana Sinhala
-- - Ada Derana English (now fixed)
-- - Daily News Sri Lanka
-- - Hiru News Sinhala
-- - Newsfirst English
```

---

## Created Endpoints

1. **`/api/admin/test-source?sourceId=X`** - Test individual source
   - Tests both RSS and scraping
   - Returns diagnostic logs
   - Shows what works and what doesn't

2. **`/api/admin/fix-sources`** (POST) - Batch update RSS URLs
   - Tests each URL before updating
   - Returns success/failure for each source

3. **`/api/admin/update-source-feeds`** (POST) - Manual RSS updates
   - Updates specific sources by ID
   - Validates RSS feeds work before updating

---

## Summary

**Current Status**:
- ✅ 5/14 sources working (Ada Derana Sinhala, Ada Derana English, Daily News, Hiru News Sinhala, Newsfirst English)
- ⚠️ 6/14 sources failing (need RSS URLs)
- ❌ 3/14 sources untested

**Success Rate**: 36% → Target: 90%+

**Next Steps**:
1. Manually find working RSS URLs
2. Fix domain constraint issues
3. Update sources table with verified RSS feeds
4. Re-test pipeline

---

**Priority**: Medium (pipeline works but could fetch 3x more articles)

**Estimated Time**: 30-60 minutes to manually find all RSS feeds

---

*Last Updated: 2025-10-11*
*5 sources working, 6 need RSS URLs*
