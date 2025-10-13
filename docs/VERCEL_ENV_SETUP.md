# Vercel Environment Variables Setup

## 🚨 **IMPORTANT: Add Environment Variables to Vercel**

Your app is deployed but **environment variables are missing**. This causes errors.

---

## ✅ **Quick Setup (5 minutes)**

### 1. **Go to Vercel Dashboard**

Visit: https://vercel.com/ravana-indus-projects/002-ai-new/settings/environment-variables

Or:
1. Go to https://vercel.com/dashboard
2. Click on **002-ai-new** project
3. Click **Settings** tab
4. Click **Environment Variables**

---

### 2. **Add ALL Environment Variables**

Copy from your **`.env.local`** file and add each one:

#### **Supabase Variables** (REQUIRED)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### **Azure OpenAI Variables** (REQUIRED)
```bash
AZURE_OPENAI_API_KEY=your-azure-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your-gpt-deployment-name
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

#### **Admin Security** (REQUIRED)
```bash
ADMIN_TOKEN=tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=
```

#### **Environment** (REQUIRED)
```bash
NODE_ENV=production
```

---

### 3. **Set Environments**

For each variable, select **all environments**:
- ✅ Production
- ✅ Preview
- ✅ Development

---

### 4. **Redeploy**

After adding all variables:

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Check ✅ **Use existing Build Cache**
5. Click **Redeploy**

**Option B: Via CLI**
```bash
vercel --prod
```

---

## 🔍 **How to Find Your Environment Variables**

### **Supabase Variables**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Keep secret!)

### **Azure OpenAI Variables**

1. Go to https://portal.azure.com
2. Navigate to your **Azure OpenAI** resource
3. Click **Keys and Endpoint**
4. Copy:
   - **KEY 1** → `AZURE_OPENAI_API_KEY`
   - **Endpoint** → `AZURE_OPENAI_ENDPOINT`
5. Go to **Model deployments**
6. Copy deployment names:
   - GPT model name → `AZURE_OPENAI_DEPLOYMENT_NAME`
   - Embedding model → `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`

---

## ⚙️ **Vercel Environment Variables UI**

For each variable, click **Add New**:

```
┌─────────────────────────────────────────────┐
│ Name: NEXT_PUBLIC_SUPABASE_URL              │
├─────────────────────────────────────────────┤
│ Value: https://xxx.supabase.co              │
├─────────────────────────────────────────────┤
│ Environments:                               │
│ ☑ Production                                │
│ ☑ Preview                                   │
│ ☑ Development                               │
└─────────────────────────────────────────────┘
         [Add]   [Cancel]
```

Repeat for all 9 variables above.

---

## ✅ **Verification**

After redeploying with environment variables:

### 1. **Check Homepage**
```
https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app
```
Should load without errors.

### 2. **Test Database Connection**
```bash
curl https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/check-db
```

Expected response:
```json
{
  "ok": true,
  "message": "Database connected"
}
```

### 3. **Test Pipeline Endpoint**
```bash
curl -X GET \
  -H "Authorization: Bearer tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=" \
  https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/api/tasks/run-every-30min
```

Expected response:
```json
{
  "ok": true,
  "results": { ... },
  "timestamp": "..."
}
```

---

## 🐛 **Troubleshooting**

### **Error: "Database connection failed"**

**Solution**: Check Supabase variables are correct
```bash
# Verify in Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### **Error: "Azure OpenAI error"**

**Solution**: Check Azure OpenAI variables
```bash
# Verify in Vercel dashboard
AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_DEPLOYMENT_NAME
AZURE_OPENAI_EMBEDDING_DEPLOYMENT
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

### **Error: "Unauthorized" on pipeline endpoint**

**Solution**: Check admin token
```bash
# Verify in Vercel dashboard
ADMIN_TOKEN=tuPIzsJ4wHQnJO5Tl5uJc/E5+vvH7lYSGAwEYvN2FiA=
```

### **Still not working?**

**Check Vercel logs**:
```bash
vercel logs --prod --follow
```

Or in Vercel Dashboard:
1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **Runtime Logs** tab

---

## 📋 **Complete Checklist**

- [ ] Added `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Added `AZURE_OPENAI_API_KEY`
- [ ] Added `AZURE_OPENAI_ENDPOINT`
- [ ] Added `AZURE_OPENAI_DEPLOYMENT_NAME`
- [ ] Added `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`
- [ ] Added `AZURE_OPENAI_API_VERSION`
- [ ] Added `ADMIN_TOKEN`
- [ ] Added `NODE_ENV=production`
- [ ] Selected **all environments** for each variable
- [ ] Redeployed application
- [ ] Tested homepage (loads successfully)
- [ ] Tested `/api/check-db` (returns OK)
- [ ] Tested pipeline endpoint (returns results)

---

## 🔐 **Security Notes**

⚠️ **NEVER commit these to Git**:
- `SUPABASE_SERVICE_ROLE_KEY` (full database access)
- `AZURE_OPENAI_API_KEY` (billable API access)
- `ADMIN_TOKEN` (administrative access)

✅ **Only add them in**:
- `.env.local` (local development, gitignored)
- Vercel Dashboard (production)

---

## 🚀 **After Setup**

Once environment variables are added and redeployed:

1. **Homepage should work**: https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app
2. **Admin panel should work**: https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app/admin/sync
3. **Pipeline endpoint ready**: `/api/tasks/run-every-30min`

**Next**: Set up cron automation (see `VERCEL_DEPLOYMENT_CRON_OPTIONS.md`)

---

**Deployment URL**: https://002-ai-a2uqeu4wq-ravana-indus-projects.vercel.app

**Dashboard**: https://vercel.com/ravana-indus-projects/002-ai-new

---

*Last Updated: 2025-10-11*
*Environment setup required before app will work*
