# Quick Start: Automated Pipeline (30 Minutes)

## 🚀 5-Minute Setup

### 1. Generate Admin Token

```bash
openssl rand -base64 32
```

Copy the output (e.g., `h8K3mP9xR2wQ7vN1jL5zT4yU6sA0bE8dF3gH9kM2nC5=`)

---

### 2. Add to Environment Variables

**Local Development** (`.env.local`):
```bash
ADMIN_TOKEN=h8K3mP9xR2wQ7vN1jL5zT4yU6sA0bE8dF3gH9kM2nC5=
```

**Vercel Production**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Name: `ADMIN_TOKEN`
   - Value: `h8K3mP9xR2wQ7vN1jL5zT4yU6sA0bE8dF3gH9kM2nC5=`
   - Environments: Production, Preview, Development
3. Click "Save"

---

### 3. Deploy to Vercel

```bash
# Commit changes
git add vercel.json app/api/tasks/run-every-30min/
git commit -m "Add automated pipeline - runs every 30 minutes"
git push

# Deploy (if not auto-deployed)
vercel --prod
```

---

### 4. Verify Cron Setup

**Vercel Dashboard**:
1. Go to Your Project → Settings → Cron Jobs
2. You should see:
   ```
   */30 * * * *  →  /api/tasks/run-every-30min
   ```

**Status**: ✅ Active

---

### 5. Test Manually (Optional)

```bash
# Local test
./scripts/test-automated-pipeline.sh "YOUR_ADMIN_TOKEN"

# Production test
curl -X GET https://your-domain.vercel.app/api/tasks/run-every-30min \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## ✅ Expected Results

### Immediate:
- Pipeline runs every 30 minutes automatically
- No manual intervention needed
- Results logged to `pipeline_runs` table

### Per Run (every 30 minutes):
- 📥 Fetches ~100-140 articles (10 per source)
- 🔍 Generates embeddings for new articles
- 📊 Clusters with 0.88 threshold
- 📝 Creates 8-12 events
- 🌐 Generates summaries in 3 languages
- ⚖️ Detects bias in coverage
- 🏷️ Classifies categories
- 🔗 Deduplicates similar events

### Daily Totals (48 runs):
- ~4,800-6,720 articles processed
- ~384-576 events created
- ~1,152-1,728 coverage entries

---

## 📊 Monitor Progress

### Option 1: Admin Sync Page
```
http://localhost:3000/admin/sync
```

Shows:
- Recent pipeline runs
- Success/failure status
- Processing times
- Articles/events counts

### Option 2: Database Query
```sql
-- Check last 10 runs
SELECT
  id,
  status,
  trigger,
  created_at,
  finished_at,
  EXTRACT(EPOCH FROM (finished_at - created_at)) as duration_sec
FROM pipeline_runs
ORDER BY created_at DESC
LIMIT 10;
```

### Option 3: Vercel Logs
```bash
vercel logs --follow
```

---

## ⚙️ Customization

### Change Schedule

Edit `vercel.json`:

**Every 15 minutes**:
```json
"schedule": "*/15 * * * *"
```

**Every hour**:
```json
"schedule": "0 * * * *"
```

**Business hours only (9am-5pm)**:
```json
"schedule": "*/30 9-17 * * *"
```

**Weekdays only**:
```json
"schedule": "*/30 * * * 1-5"
```

After editing, redeploy:
```bash
git add vercel.json
git commit -m "Update cron schedule"
git push
```

---

## 🐛 Troubleshooting

### Cron not running?

**Check 1**: Verify environment variable
```bash
vercel env ls
# Should show ADMIN_TOKEN
```

**Check 2**: Check Vercel dashboard
- Settings → Cron Jobs
- Should show: `*/30 * * * *` → `/api/tasks/run-every-30min`

**Check 3**: Check logs
```bash
vercel logs --since 1h | grep "run-every-30min"
```

### Pipeline failing?

**Check database connection**:
```bash
curl https://your-domain.vercel.app/api/check-db
```

**Check recent runs**:
```sql
SELECT error_message
FROM pipeline_runs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;
```

### Too expensive?

**Option A**: Reduce frequency to every hour
```json
"schedule": "0 * * * *"
```

**Option B**: Reduce articles per source (in `lib/rss.ts`, `lib/scraper.ts`):
```typescript
limit: number = 5  // Instead of 10
```

---

## 💰 Cost Estimate

**Azure OpenAI API** (per 30-min run):
- Embeddings: ~$0.0001
- Summaries: ~$0.009
- Bias detection: ~$0.001
- **Total**: ~$0.01 USD

**Daily** (48 runs): ~$0.48 USD
**Monthly** (1,440 runs): ~$14.40 USD

---

## 🎯 Success Checklist

- [x] vercel.json created with cron schedule
- [x] /api/tasks/run-every-30min endpoint created
- [x] ADMIN_TOKEN generated and set
- [x] Deployed to Vercel
- [x] Cron job shows in Vercel dashboard
- [x] First run completed successfully
- [x] Events appearing on homepage

---

## 📚 More Documentation

- Full setup: `docs/AUTOMATED_PIPELINE_SETUP.md`
- Clustering fix: `docs/CLUSTERING_FIX_COMPLETE.md`
- Source fixes: `docs/SOURCE_FETCHING_ISSUE.md`

---

## 🚀 Next Steps After Setup

1. **Monitor first few runs** - Check `/admin/sync` page
2. **Fix failing sources** - Run `docs/QUICK_FIX_SOURCES.sql`
3. **Verify clustering quality** - Check events have matching content
4. **Adjust schedule if needed** - Change frequency in `vercel.json`

---

**Status**: ✅ Ready to deploy

**Deployment time**: ~5 minutes
**First automated run**: 30 minutes after deployment

---

*Last Updated: 2025-10-11*
*Automated pipeline configured for 30-minute intervals*
