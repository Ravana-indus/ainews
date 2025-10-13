# Vercel Deployment - Cron Options

## Deployment Status

✅ **Deployed Successfully**

**Production URL**: https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app

**Inspect URL**: https://vercel.com/ravana-indus-projects/002-ai-new/FrZA47Q1puzKifdxKRKymJxuqhGQ

---

## ⚠️ Vercel Hobby Plan Limitation

**Issue**: Vercel Hobby (free) plan only supports **daily cron jobs** (once per day).

Your 30-minute cron (`*/30 * * * *`) requires **Vercel Pro plan** ($20/month).

---

## 🎯 Options for Automated Pipeline

### **Option 1: Upgrade to Vercel Pro** (Recommended if budget allows)

**Cost**: $20/month

**Steps**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Upgrade to Pro**
3. Update `vercel.json`:
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
4. Redeploy:
   ```bash
   git add vercel.json
   git commit -m "Add 30-minute cron (Pro plan)"
   git push
   ```

**Benefits**:
- Native Vercel integration
- Automatic execution
- Vercel monitoring
- No external dependencies

---

### **Option 2: Free External Cron Service** (Recommended for Hobby plan)

Use a **free cron service** to call your endpoint every 30 minutes.

#### **A. Cron-Job.org** (Free, Recommended)

**Steps**:

1. **Sign up**: https://cron-job.org/en/signup/

2. **Create New Job**:
   - URL: `https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min`
   - Schedule: `*/30 * * * *` (every 30 minutes)
   - Title: `News Pipeline - Every 30 Min`

3. **Add Authorization Header**:
   - Header Name: `Authorization`
   - Header Value: `Bearer tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=`

4. **Save and Enable**

**Free Tier Limits**:
- Unlimited cron jobs
- 1-minute minimum interval
- Email notifications on failures
- Execution history

---

#### **B. EasyCron** (Free tier available)

**Steps**:

1. **Sign up**: https://www.easycron.com/user/register

2. **Create Cron Job**:
   - URL: `https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min`
   - Cron Expression: `*/30 * * * *`
   - HTTP Method: GET
   - Custom Headers: `Authorization: Bearer tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=`

3. **Test** and **Enable**

**Free Tier Limits**:
- 1 cron job
- Up to 1 execution per minute
- Email notifications

---

#### **C. GitHub Actions** (Free for public repos)

**Steps**:

1. **Create Workflow File**: `.github/workflows/pipeline-cron.yml`

```yaml
name: Automated Pipeline (Every 30 Minutes)

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  run-pipeline:
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Pipeline
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}" \
            https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min

      - name: Check Response
        if: failure()
        run: echo "Pipeline execution failed"
```

2. **Add Secret**:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add secret:
     - Name: `ADMIN_TOKEN`
     - Value: `tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=`

3. **Commit and Push**:
```bash
git add .github/workflows/pipeline-cron.yml
git commit -m "Add GitHub Actions cron for pipeline"
git push
```

**Free Tier Limits**:
- Free for public repositories
- 2,000 minutes/month (plenty for simple cron)
- Automatic execution
- GitHub monitoring

---

#### **D. UptimeRobot** (Free monitoring + cron)

**Steps**:

1. **Sign up**: https://uptimerobot.com/signUp

2. **Add New Monitor**:
   - Monitor Type: HTTP(s)
   - Friendly Name: `News Pipeline 30min`
   - URL: `https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min`
   - Monitoring Interval: **Every 30 minutes**
   - Custom HTTP Headers:
     ```
     Authorization: Bearer tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=
     ```

3. **Save Monitor**

**Free Tier Limits**:
- 50 monitors
- 5-minute minimum interval (but 30-min works)
- Email alerts
- Public status page

---

### **Option 3: Daily Cron (Vercel Hobby Plan Native)**

If you can accept **once per day** instead of every 30 minutes:

**Update vercel.json**:
```json
{
  "crons": [
    {
      "path": "/api/tasks/run-every-30min",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule**: `0 0 * * *` = Every day at midnight UTC

**Redeploy**:
```bash
git add vercel.json
git commit -m "Add daily cron for Hobby plan"
git push
vercel --prod
```

**Benefits**:
- Free (native Vercel Hobby plan)
- No external dependencies

**Drawbacks**:
- Only runs once per day
- Less frequent updates

---

## 🚀 Quick Setup: Cron-Job.org (Recommended for Free)

### 1. Create Account
Visit: https://cron-job.org/en/signup/

### 2. Create Cron Job
- **URL**: `https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min`
- **Schedule**: `*/30 * * * *`
- **Title**: `SriLankaLens Pipeline`
- **Enabled**: ✅

### 3. Add Header
Click **Headers** → **Add Header**:
```
Authorization: Bearer tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=
```

### 4. Test
Click **Run Now** to test immediately.

### 5. Monitor
- View execution history
- Get email alerts on failures
- Monitor success rate

---

## 📊 Comparison

| Option | Cost | Setup Time | Reliability | Monitoring |
|--------|------|------------|-------------|------------|
| **Vercel Pro** | $20/mo | 5 min | ⭐⭐⭐⭐⭐ | Native Vercel |
| **Cron-Job.org** | Free | 10 min | ⭐⭐⭐⭐ | Email alerts |
| **GitHub Actions** | Free* | 15 min | ⭐⭐⭐⭐ | GitHub UI |
| **EasyCron** | Free | 10 min | ⭐⭐⭐⭐ | Email alerts |
| **UptimeRobot** | Free | 10 min | ⭐⭐⭐ | Uptime monitoring |
| **Daily Cron (Hobby)** | Free | 5 min | ⭐⭐⭐⭐⭐ | Native Vercel |

*Free for public repos

---

## ✅ Current Setup

**Deployment**: ✅ Live on Vercel
**Pipeline Endpoint**: ✅ `/api/tasks/run-every-30min` ready
**Admin Token**: ✅ Generated
**Cron**: ⚠️ **Needs external setup** (Hobby plan limitation)

---

## 🎯 Recommended Next Steps

### **For Free Hobby Plan** (Recommended):

1. **Sign up for Cron-Job.org** (5 minutes)
2. **Create cron job** with URL and auth header (3 minutes)
3. **Test immediately** (1 minute)
4. **Monitor** in Cron-Job.org dashboard

**Total Setup Time**: ~10 minutes
**Cost**: $0/month

---

### **For Budget-Friendly Production** (Alternative):

1. **Upgrade to Vercel Pro** ($20/month)
2. **Update vercel.json** with cron config
3. **Redeploy**
4. **Monitor** in Vercel dashboard

**Total Setup Time**: ~5 minutes
**Cost**: $20/month

---

## 📞 Environment Variables Required

**Add to Vercel** (Settings → Environment Variables):

1. **ADMIN_TOKEN**: `tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=`
2. All Supabase and Azure OpenAI variables (from `.env.local`)

**Redeploy after adding**:
```bash
vercel --prod
```

---

## 🧪 Test Your Deployment

```bash
# Test pipeline endpoint
curl -X GET \
  -H "Authorization: Bearer tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=" \
  https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min

# Expected response:
{
  "ok": true,
  "results": { ... },
  "schedule": "Every 30 minutes",
  "timestamp": "2025-10-11T..."
}
```

---

## 📚 Documentation

- **Quick Start**: `docs/QUICK_START_AUTOMATION.md`
- **Full Setup**: `docs/AUTOMATED_PIPELINE_SETUP.md`
- **Session Summary**: `docs/SESSION_SUMMARY.md`

---

**Status**: ✅ Deployed to Vercel (Hobby plan)

**Action Required**: Set up external cron service (Cron-Job.org recommended)

---

*Last Updated: 2025-10-11*
*Deployment URL: https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app*
