# Automated Pipeline Setup - Every 30 Minutes

## Date: 2025-10-11

---

## Overview

The pipeline now runs automatically **every 30 minutes** to fetch, process, and publish news articles.

---

## Configuration Files

### 1. Vercel Cron Configuration
**File**: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/tasks/run-every-30min",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**Schedule Format**: `*/30 * * * *` (Cron syntax)
- `*/30` = Every 30 minutes
- `* * * *` = Every hour, day, month, day of week

### 2. Pipeline Endpoint
**File**: `app/api/tasks/run-every-30min/route.ts`
- Runs complete pipeline (fetch → process → publish)
- Logs results to `pipeline_runs` table
- Secured with admin token + Vercel cron header

---

## Deployment

### Vercel (Recommended)

1. **Push to Git**:
   ```bash
   git add vercel.json app/api/tasks/run-every-30min/
   git commit -m "Add 30-minute automated pipeline"
   git push
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Verify Cron Setup**:
   - Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
   - You should see: `*/30 * * * *` → `/api/tasks/run-every-30min`

4. **Set Environment Variables**:
   - Add `ADMIN_TOKEN` in Vercel Dashboard → Settings → Environment Variables
   - Generate secure token: `openssl rand -base64 32`

### Other Platforms

#### Railway / Render / DigitalOcean
Use external cron service to trigger the endpoint:

**Option A: Cron-Job.org** (Free)
1. Sign up at https://cron-job.org
2. Create new job:
   - URL: `https://your-domain.com/api/tasks/run-every-30min`
   - Schedule: Every 30 minutes
   - Header: `Authorization: Bearer YOUR_ADMIN_TOKEN`

**Option B: EasyCron** (Free tier available)
1. Sign up at https://www.easycron.com
2. Create cron job with 30-minute interval
3. Add authorization header

**Option C: GitHub Actions** (Free for public repos)
Create `.github/workflows/pipeline-cron.yml`:
```yaml
name: Run Pipeline Every 30 Minutes

on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch: # Manual trigger

jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Pipeline
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}" \
            https://your-domain.com/api/tasks/run-every-30min
```

---

## Testing

### 1. Manual Trigger (Development)

```bash
# With admin token
curl -X GET http://localhost:3000/api/tasks/run-every-30min \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Response:
{
  "ok": true,
  "results": {
    "articlesProcessed": 100,
    "eventsCreated": 8,
    "clustersCreated": 8
  },
  "schedule": "Every 30 minutes",
  "timestamp": "2025-10-11T12:30:00.000Z"
}
```

### 2. Manual Trigger (Production)

```bash
curl -X GET https://your-domain.com/api/tasks/run-every-30min \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Check Pipeline Status

```bash
# Visit admin sync page
http://localhost:3000/admin/sync

# Or query database directly
curl "http://localhost:3000/api/admin/sync?action=status"
```

---

## Monitoring

### 1. Check Last Run

**Supabase SQL Editor**:
```sql
SELECT
  id,
  status,
  trigger,
  created_at,
  finished_at,
  error_message,
  EXTRACT(EPOCH FROM (finished_at - created_at)) as duration_seconds
FROM pipeline_runs
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Check Success Rate

```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM pipeline_runs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### 3. Monitor Vercel Logs

```bash
vercel logs --follow
```

---

## Pipeline Execution Flow

```
Every 30 minutes:
  1. Vercel Cron triggers /api/tasks/run-every-30min
  2. Endpoint validates cron header
  3. Creates pipeline_run record (status: running)
  4. Runs complete pipeline:
     a. Fetch 10 articles per source (14 sources = 140 articles)
     b. Generate embeddings (Azure OpenAI)
     c. Cluster with 0.88 threshold
     d. Create events with coverage
     e. Generate summaries (3 languages)
     f. Detect bias
     g. Classify categories
     h. Deduplicate events
  5. Log results to database
  6. Update pipeline_run (status: completed/failed)
```

---

## Expected Results

### Per 30-Minute Run:
- **Articles fetched**: ~100-140 (10 per source × 14 sources)
- **Events created**: ~8-12 (with 0.88 threshold)
- **Execution time**: 2-5 minutes
- **API calls**: ~150-200 (embeddings + summaries + bias + classification)

### Daily Totals (48 runs):
- **Articles processed**: ~4,800-6,720
- **Events created**: ~384-576
- **Coverage entries**: ~1,152-1,728

---

## Troubleshooting

### Issue: Cron not running

**Check 1**: Verify Vercel cron configuration
```bash
vercel env ls
# Ensure ADMIN_TOKEN is set
```

**Check 2**: Check Vercel Dashboard
- Settings → Cron Jobs
- Should show: `*/30 * * * *`

**Check 3**: Check logs
```bash
vercel logs --since 1h
```

### Issue: Pipeline failing

**Check database connection**:
```bash
curl http://localhost:3000/api/check-db
```

**Check Azure OpenAI**:
```bash
# Test embedding generation
curl -X POST http://localhost:3000/api/ai/test-pipeline
```

**Check Supabase tables**:
```sql
-- Verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Issue: Too many API calls

**Reduce fetch limit** (temporarily):
```typescript
// In lib/rss.ts, lib/scraper.ts, lib/data.ts
// Change from 10 to 5
limit: number = 5
```

**Or reduce cron frequency**:
```json
// In vercel.json
// Change to every hour
"schedule": "0 * * * *"
```

---

## Cost Estimation

### Azure OpenAI API Costs (per run):

**Embeddings** (text-embedding-3-small):
- 100 articles × ~500 tokens = 50,000 tokens
- $0.002 per 1M tokens = $0.0001

**Summaries** (gpt-5-mini):
- 8 events × 3 languages × 1,000 tokens = 24,000 tokens
- $0.075 per 1M input + $0.30 per 1M output
- ~$0.009 per run

**Total per run**: ~$0.01 USD
**Daily cost** (48 runs): ~$0.48 USD
**Monthly cost** (1,440 runs): ~$14.40 USD

---

## Optimization Options

### 1. Skip Duplicate Embeddings
Don't re-embed articles that already have embeddings:
```typescript
// Already implemented in lib/ai/pipeline.ts
.not('embedding', 'is', null)
```

### 2. Batch Processing
Process in batches to reduce concurrent API calls:
```typescript
// Process 5 sources at a time instead of all 14
for (let i = 0; i < sources.length; i += 5) {
  const batch = sources.slice(i, i + 5);
  await Promise.all(batch.map(fetchAndProcess));
}
```

### 3. Rate Limiting
Add delays between API calls:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
```

---

## Customizing Schedule

### Change to Every Hour:
```json
"schedule": "0 * * * *"
```

### Change to Every 15 Minutes:
```json
"schedule": "*/15 * * * *"
```

### Change to Every 2 Hours:
```json
"schedule": "0 */2 * * *"
```

### Change to Business Hours Only (9am-5pm):
```json
"schedule": "*/30 9-17 * * *"
```

### Multiple Schedules:
```json
{
  "crons": [
    {
      "path": "/api/tasks/run-every-30min",
      "schedule": "*/30 9-17 * * *",
      "comment": "Every 30 min during business hours"
    },
    {
      "path": "/api/tasks/run-hourly",
      "schedule": "0 * * * *",
      "comment": "Every hour overnight"
    }
  ]
}
```

---

## Security

### 1. Admin Token
Generate secure token:
```bash
openssl rand -base64 32
```

Add to `.env.local`:
```bash
ADMIN_TOKEN=your-secure-token-here
```

### 2. Vercel Cron Header
In production, endpoint validates `x-vercel-cron: 1` header automatically

### 3. IP Whitelist (Optional)
Add to endpoint:
```typescript
const allowedIPs = ['76.76.21.21']; // Vercel IP range
const clientIP = req.headers.get('x-forwarded-for');
if (!allowedIPs.includes(clientIP)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Status

✅ **CONFIGURED AND READY**

**Action Required**:
1. Set `ADMIN_TOKEN` in Vercel environment variables
2. Deploy to Vercel
3. Verify cron runs in Vercel Dashboard

---

**Next Run**: Every 30 minutes starting from deployment

**Monitoring**: Check `/admin/sync` page for recent runs

---

*Last Updated: 2025-10-11*
*Automated pipeline configured for 30-minute intervals*
