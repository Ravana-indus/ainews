# 🚀 Deployment Checklist

## ✅ Completed

- [x] Code committed to Git
- [x] Pushed to GitHub (https://github.com/Ravana-indus/ainews)
- [x] Deployed to Vercel
- [x] Production URL: https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app

---

## ⚠️ **URGENT: Required Actions**

### 1. **Add Environment Variables to Vercel** (5 minutes)

**Go to**: https://vercel.com/ravana-indus-projects/002-ai-new/settings/environment-variables

**Add these 10 variables** (copy from `.env.local`):

```bash
# Supabase (3 variables)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Azure OpenAI (5 variables)
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your-gpt-deployment
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_API_VERSION=2024-08-01-preview

# Security (1 variable)
ADMIN_TOKEN=tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=

# Environment (1 variable)
NODE_ENV=production
```

**For each variable**:
- Click "Add New"
- Enter Name and Value
- Select: ✅ Production, ✅ Preview, ✅ Development
- Click "Add"

**Then redeploy**:
```bash
vercel --prod
```

Or in Vercel Dashboard: Deployments → Latest → ⋯ → Redeploy

---

### 2. **Set Up Cron Automation** (10 minutes)

**Option A: Free (Recommended for Hobby plan)**

Use **Cron-Job.org**:
1. Sign up: https://cron-job.org/en/signup/
2. Create new job:
   - URL: `https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min`
   - Schedule: `*/30 * * * *`
   - Header: `Authorization: Bearer tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=`
3. Enable and test

**Option B: Paid ($20/month)**

Upgrade to Vercel Pro for native cron:
1. Upgrade at https://vercel.com/dashboard
2. Update `vercel.json` (see docs/VERCEL_DEPLOYMENT_CRON_OPTIONS.md)
3. Redeploy

---

### 3. **Fix Remaining Sources** (5 minutes)

**Execute in Supabase SQL Editor**:

Copy and run `docs/QUICK_FIX_SOURCES.sql`:
```sql
UPDATE sources SET rss_url = 'https://www.dailymirror.lk/feed/' WHERE name = 'Daily Mirror';
UPDATE sources SET rss_url = 'https://www.hirunews.lk/rss.php' WHERE name = 'Hirunews English';
-- ... (see full script)
```

---

## 📊 **Verification Steps**

### After adding environment variables:

1. **Test Homepage**:
   ```
   https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app
   ```
   Should load without errors ✅

2. **Test Database**:
   ```bash
   curl https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/check-db
   ```
   Should return `{"ok": true}` ✅

3. **Test Pipeline**:
   ```bash
   curl -H "Authorization: Bearer tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=" \
     https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min
   ```
   Should return results ✅

---

## 📚 **Documentation**

- **Environment Setup**: `docs/VERCEL_ENV_SETUP.md`
- **Cron Options**: `docs/VERCEL_DEPLOYMENT_CRON_OPTIONS.md`
- **Full Summary**: `docs/SESSION_SUMMARY.md`
- **Quick Start**: `docs/QUICK_START_AUTOMATION.md`

---

## 🎯 **What's Working Now**

✅ Code deployed to Vercel
✅ Production URL live
✅ Pipeline endpoint ready (`/api/tasks/run-every-30min`)
✅ Admin token generated
✅ All code changes from session applied

---

## ⚠️ **What Needs Configuration**

❌ Environment variables (required for app to work)
❌ Cron automation (required for automatic pipeline)
❌ Source RSS URLs (5 sources need fixing)

---

## ⏱️ **Time Required**

- Add environment variables: **5 minutes**
- Set up cron automation: **10 minutes**
- Fix source RSS URLs: **5 minutes**
- **Total**: ~20 minutes

---

## 🚀 **Next Steps (In Order)**

1. **Add environment variables** → Make app work
2. **Redeploy** → Apply environment variables
3. **Set up cron** → Enable automation
4. **Fix sources** → Get all 14 sources working
5. **Monitor** → Check `/admin/sync` for runs

---

**Deployment Status**: ⚠️ Deployed but needs configuration

**Action Required**: Add environment variables to Vercel

**Estimated Time to Full Operation**: 20 minutes

---

*Last Updated: 2025-10-11*
*Deployment URL: https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app*
