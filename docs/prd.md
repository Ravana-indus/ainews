

Below is a **Product Requirements Document (PRD)** for the tri‑lingual Sri Lankan news intelligence platform, optimized for **Next.js on Vercel**. Per request, this file starts with a complete, build‑ready frontend UI plan using dummy data, derived from `docs/uiux.md`. Platform architecture and backend details follow afterward.

---

# 📰 **PRD – “SriLankaLens.ai”**

> **AI-powered tri-lingual news platform for Sri Lanka**
> *(English | Sinhala | Tamil)*
> A real-time, bias-analyzed, multilingual news ecosystem that summarizes, compares, and contextualizes how different outlets report the same event.

---

## **Frontend UI — Dummy Data MVP**

Reference: `docs/uiux.md` (Sections 3–5). Goal: ship a mobile‑first, accessible, SEO‑friendly UI with mocked data to validate flows, interactions, and tri‑lingual layouts before integrating APIs.

### **Tech & Constraints**
- `Next.js 14` (App Router), `TypeScript`, `Tailwind CSS`
- `react-intl` or `next-intl` with cookie + localStorage for language persistence
- Icons: `lucide-react` (stroke 1.5px), images via static `/public/logos/*`
- Mobile‑first design for 360–400px, progressive enhancement to tablet/desktop
- A11y AA+: focus rings, semantic HTML, clear labels; SSR/ISR for SEO

### **Routing Map (Public + Admin)**
- `/` Home (Feed)
- `/event/[id]` Event Details
- `/search` Search & Explore
- `/newsletter` Newsletter Signup
- `/about` + `/methodology` Static Pages
- `/sources` Sources list
- `/admin` Dashboard
- `/admin/sources`, `/admin/events`, `/admin/articles`, `/admin/qa`, `/admin/translations`, `/admin/settings`, `/admin/logs`

### **Global UI**
- Header: Logo (left) • Language switch (EN | සි | த) • Search icon
- Top strip: “Last updated HH:MM • Hourly” + Confidence average
- Footer: Sources • Methodology • Privacy • Terms • Contact

### **Components (Spec + Dummy Props)**

#### EventCard
- Props: `id`, `title`, `summary`, `updatedAt`, `confidence`, `sources[]`, `biasSummary[]`, `href`, `category`
- States: loading (skeleton), error, compact (list), full (grid)
- Accessibility: Whole card clickable; `aria-describedby` summary; keyboard focus ring

#### BiasChip
- Scale: −2, −1, 0, +1, +2
- Color: red (−), gray (0), green (+); label always included (no color‑only)

#### ConfidenceBadge
- Ranges: 0–49 (low, amber), 50–79 (medium, blue), 80–100 (high, green)
- Tooltip: brief explanation of computation (mocked)

#### SourceTile
- Fields: logo, outlet name, time, outbound link (nofollow, new tab), lean chip, reason (1 line)

#### LanguageSwitcher
- Modes: inline pill group (EN | සි | த); bottom sheet on mobile on tap
- Persistence: cookie `lang` + localStorage `langPreference`; deep link `?lang=`

#### InfiniteList
- IntersectionObserver sentinel triggers next page; 3 skeletons during fetch

#### Toasts & Notices
- Snackbar for network errors; retry action (mocked callback)

### **Dummy Data — Types & Examples**

```ts
// core types used across pages/components
type LanguageCode = 'en' | 'si' | 'ta';

type Source = {
  id: string;
  name: string;
  domain: string;
  language: LanguageCode;
  reliability: number; // 0.0–1.0
  logoUrl: string; // /logos/<slug>.png
};

type SourceCoverage = {
  sourceId: string;
  headline: string;
  lean: -2 | -1 | 0 | 1 | 2;
  reason: string; // 1 line
  url: string;
  publishedAt: string; // ISO
};

type EventItem = {
  id: string;
  title: string; // canonical
  summary: {
    en: string;
    si: string;
    ta: string;
  };
  updatedAt: string; // ISO
  confidence: number; // 0–100
  category: string; // e.g., Economy, Politics
  sources: SourceCoverage[];
  biasSummary: { sourceId: string; score: -2 | -1 | 0 | 1 | 2; label: string }[];
};

type KPI = {
  articles24h: number;
  eventsCreated: number;
  summariesGenerated: number;
  failures: number;
  avgConfidence: number;
};
```

```json
{
  "sources": [
    { "id": "src_adaderana", "name": "Ada Derana", "domain": "adaderana.lk", "language": "si", "reliability": 0.84, "logoUrl": "/logos/adaderana.png" },
    { "id": "src_newsfirst", "name": "NewsFirst", "domain": "newsfirst.lk", "language": "si", "reliability": 0.82, "logoUrl": "/logos/newsfirst.png" },
    { "id": "src_dailymirror", "name": "Daily Mirror", "domain": "dailymirror.lk", "language": "en", "reliability": 0.86, "logoUrl": "/logos/dailymirror.png" },
    { "id": "src_tamilguardian", "name": "Tamil Guardian", "domain": "tamilguardian.com", "language": "ta", "reliability": 0.80, "logoUrl": "/logos/tamilguardian.png" }
  ],
  "events": [
    {
      "id": "evt_001",
      "title": "Fuel prices revised amid global crude fluctuation",
      "summary": {
        "en": "The government announced a fuel price revision citing international crude volatility and domestic fiscal adjustments. Multiple outlets reported differing emphasis on consumer impact and policy rationale.",
        "si": "රජය ග්‍රෑඩ් මිල ඉහළ පහළ යා ගැන සහ දේශීය මුදල් ප්‍රතිසංස්කරණය දක්වා ඉන්ධන මිල සංශෝධනයක් ප්‍රකාශ කළා. outlet කිහිපයක් පාරිභෝගික බලපෑම සහ ප්‍රතිපත්ති හේතු වෙනස් වශයෙන් අවධාරණය කළා.",
        "ta": "அரசு சர்வதேச எண்ணெய் விலை மாற்றம் மற்றும் உள்நாட்டு நிதி சரிசெய்தல் காரணமாக எரிபொருள் விலை திருத்தத்தை அறிவித்தது. பல ஊடகங்கள் நுகர்வோர் தாக்கம் மற்றும் கொள்கை காரணங்களை மாறுபட்ட மையமாகக் கூறின."
      },
      "updatedAt": "2025-10-09T10:00:00Z",
      "confidence": 78,
      "category": "Economy",
      "sources": [
        { "sourceId": "src_adaderana", "headline": "இන්ධන මිල වැඩි — ජනතාවට වැඩි බර", "lean": -1, "reason": "Focus on citizen burden", "url": "https://adaderana.lk/a1", "publishedAt": "2025-10-09T08:45:00Z" },
        { "sourceId": "src_newsfirst", "headline": "Fuel price revised; ministry cites global crude", "lean": 0, "reason": "Neutral policy framing", "url": "https://newsfirst.lk/n1", "publishedAt": "2025-10-09T08:50:00Z" },
        { "sourceId": "src_dailymirror", "headline": "Govt revises prices amid IMF targets", "lean": 1, "reason": "Positive fiscal discipline", "url": "https://dailymirror.lk/d1", "publishedAt": "2025-10-09T09:10:00Z" }
      ],
      "biasSummary": [
        { "sourceId": "src_adaderana", "score": -1, "label": "Critical −1" },
        { "sourceId": "src_newsfirst", "score": 0, "label": "Neutral 0" },
        { "sourceId": "src_dailymirror", "score": 1, "label": "Favorable +1" }
      ]
    },
    {
      "id": "evt_002",
      "title": "Cabinet approves education reforms pilot",
      "summary": {
        "en": "A pilot program for curriculum modernization received cabinet approval, with emphasis on teacher training and digital content.",
        "si": "පාසල් විෂය ат modern කිරීම සඳහා පීලෝට් වැඩසටහනක් අමාත්‍යාංශ අනුමැතිය ලබා ගත්තා.",
        "ta": "பாடத்திட்ட நவீனமயமாதலுக்கான முன்முயற்சிக்கு அமைச்சரவை ஒப்புதல் அளித்தது."
      },
      "updatedAt": "2025-10-09T09:30:00Z",
      "confidence": 65,
      "category": "Education",
      "sources": [
        { "sourceId": "src_newsfirst", "headline": "Cabinet clears pilot on education reforms", "lean": 0, "reason": "Straight reporting", "url": "https://newsfirst.lk/n2", "publishedAt": "2025-10-09T09:00:00Z" },
        { "sourceId": "src_tamilguardian", "headline": "Education reforms prioritize digital", "lean": 1, "reason": "Positive tech framing", "url": "https://tamilguardian.com/t1", "publishedAt": "2025-10-09T09:20:00Z" }
      ],
      "biasSummary": [
        { "sourceId": "src_newsfirst", "score": 0, "label": "Neutral 0" },
        { "sourceId": "src_tamilguardian", "score": 1, "label": "Favorable +1" }
      ]
    }
  ],
  "kpi": { "articles24h": 128, "eventsCreated": 42, "summariesGenerated": 40, "failures": 3, "avgConfidence": 74 }
}
```

### **Page Specs with Mocks**

#### Home `/`
- Header + LanguageSwitcher
- Top strip: “Last updated 10:00 • Hourly” + Avg confidence
- Infinite `EventCard` list (dummy pagination: 10 items/page)
- Newsletter CTA card + Explore topic chips
- Empty state: “No fresh stories yet. Next update at HH:00.”

#### Event Details `/event/[id]`
- Hero: title, updated at, `ConfidenceBadge`
- Neutral summary (respect current `lang`)
- “How different outlets framed it”: `SourceTile[]` with expand/collapse excerpt
- Bias Radar (placeholder chart + legend)
- Sources: logos + names + publish times; outbound links
- Timeline (mock data): “Developing → Update 1 → Correction”
- Related events chips (up to 6)
- Share: native share, copy link, X/FB/WhatsApp buttons

#### Search & Explore `/search`
- Global search input with recent searches (localStorage)
- Results: `EventCard[]` matching keyword (client filter on mocks)
- Filters: Category, Date range, Confidence slider, Language
- Explore: Trending Topics (entity chips), People/Places/Institutions (mock lists)

#### Newsletter `/newsletter`
- Form: email + language preference; inline privacy text
- Success notice on submit with mocked delay

#### Static Pages `/about`, `/methodology`, `/sources`
- Scannable typography; diagrams placeholders for pipeline & bias rubric
- Sources list: outlets with language & reliability score

### **State, i18n, and Persistence**
- Language: cookie `lang` (server‑read) + localStorage `langPreference` (client)
- Deep links: `?lang=en|si|ta` override; default fallback `en`
- UI state: list pagination, filters, toasts — all mocked client‑side
- SSR/ISR: pages render with mocks in SSR for SEO; hydration uses same data

### **Styling & Accessibility**
- Colors: Primary `#0F172A`, Accent `#2563EB`, Pos `#16A34A`, Neg `#DC2626`, Warn `#F59E0B`; Surfaces white/Slate‑50/Slate‑100; Text Slate‑900/700/500
- Typography: Inter (en), Noto Sans Sinhala, Noto Sans Tamil; line‑height 1.5–1.7 for si/ta
- Elevation: soft shadows; rounded‑2xl; 16–24px padding; 4‑pt grid
- A11y: keyboard navigation, focus rings, labels for chips, `aria-describedby` on cards, readable contrast

### **Suggested File Scaffold (MVP)**
```
app/
  layout.tsx
  page.tsx                      # Home (Feed)
  event/[id]/page.tsx           # Event Details
  search/page.tsx               # Search & Explore
  newsletter/page.tsx           # Signup
  about/page.tsx                # About
  methodology/page.tsx          # Methodology
  sources/page.tsx              # Sources list
  admin/page.tsx                # Dashboard
  admin/sources/page.tsx        # Sources
  admin/events/page.tsx         # Events
  admin/articles/page.tsx       # Articles
  admin/qa/page.tsx             # QA/Moderation
  admin/translations/page.tsx   # Translations
  admin/settings/page.tsx       # Settings
  admin/logs/page.tsx           # Logs
components/
  Header.tsx, Footer.tsx, LanguageSwitcher.tsx
  EventCard.tsx, BiasChip.tsx, ConfidenceBadge.tsx
  SourceTile.tsx, InfiniteList.tsx, Toast.tsx
lib/
  mocks.ts                      # exports sources[], events[], kpi
  i18n.ts                       # helpers for lang cookie + deep link
public/logos/
  adaderana.png, newsfirst.png, dailymirror.png, tamilguardian.png
```

### **MVP Acceptance Criteria (Frontend)**
- Mobile‑first pages render with dummy data and pass basic a11y checks
- Language switch changes summaries and chips; persists via cookie/localStorage
- Event list paginates via Sentinel; skeletons display during mocked fetch
- Event details show source tiles with lean badges and expandable excerpts
- Search filters apply on client with mocked dataset
- Newsletter form validates and shows success state
- Static pages and sources list are navigable and readable

---

## 1️⃣ PRODUCT OVERVIEW

### Vision

To make Sri Lankan news transparent, unbiased, and accessible to everyone — regardless of language — through AI-driven summarization, bias detection, and comparative analysis.

### Mission

Deliver hourly updated, neutral, multilingual news summaries, revealing **how** outlets differ in framing the same event.

---

## 2️⃣ OBJECTIVES

| Objective               | Description                                                       | KPI                            |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------ |
| **Neutral Aggregation** | Combine news from all major outlets and summarize neutrally.      | ≥ 90 % factual accuracy        |
| **Bias Transparency**   | Expose slant in media coverage.                                   | Clear lean score on each story |
| **Tri-lingual Reach**   | Native summaries in English, Sinhala, Tamil.                      | Full parity across 3 languages |
| **Automation**          | Fully automatic ingestion, clustering, and publishing every hour. | 99 % uptime                    |
| **Trust & Credibility** | Cite sources, show reasoning, and avoid hallucination.            | < 5 % manual corrections       |

---

## 3️⃣ TARGET AUDIENCE

| Segment                    | Description                                       | Need                               |
| -------------------------- | ------------------------------------------------- | ---------------------------------- |
| **General readers**        | Everyday citizens wanting quick, factual updates. | Short, neutral summaries           |
| **Students & journalists** | For research or multilingual content.             | Bias comparison & citations        |
| **Diaspora**               | Sri Lankans abroad consuming English content.     | Cross-language coverage            |
| **Institutions / NGOs**    | Media watchdogs & universities.                   | Data API, bias analytics dashboard |

---

## 4️⃣ CORE VALUE PROPOSITION

> “SriLankaLens.ai helps citizens see the *whole truth* — not just one side — by showing how every outlet tells the same story differently.”

---

## 5️⃣ SYSTEM ARCHITECTURE

### 5.1 Platform Stack

| Layer           | Technology                                                 | Description                  |
| --------------- | ---------------------------------------------------------- | ---------------------------- |
| **Frontend**    | Next.js 14 (App Router) + Tailwind CSS                     | Static + ISR pages on Vercel |
| **Backend API** | Next.js API Routes (`/api/*`)                              | Stateless REST APIs          |
| **Database**    | Supabase (PostgreSQL + pgvector)                           | Article + event storage      |
| **Storage**     | Supabase Storage                                           | Raw HTML/text backups        |
| **Embeddings**  | OpenAI `text-embedding-3-large` or `multilingual-e5-large` | 1 vector per article         |
| **LLMs**        | GPT-4o mini / Claude 3.5 Sonnet                            | Summaries + bias scoring     |
| **Automation**  | Vercel Cron Jobs                                           | Hourly pipeline trigger      |
| **Monitoring**  | Vercel Analytics + Supabase Logs                           | Health + error tracking      |

---

## 6️⃣ DATA FLOW / PIPELINE

1. **Ingestion:** Fetch RSS/HTML feeds.
2. **Embedding:** Compute vector (1536 dims) → store in Supabase.
3. **Clustering:** Cosine similarity ≥ 0.82 → same event.
4. **Summarization:** LLM creates neutral summary + citations.
5. **Bias Detection:** LLM assigns lean (−2 to +2) + reason.
6. **Tri-lingual Output:** Sinhala + Tamil versions generated.
7. **Publishing:** Insert into `events` + `summary` tables.
8. **Regeneration:** Next.js ISR refresh (60 min).
9. **Cron:** Vercel → `/api/tasks/run-hourly` every hour.

---

## 7️⃣ DATABASE SCHEMA

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text, domain text UNIQUE, country text,
  language text, reliability_score numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  url text UNIQUE, title text, author text,
  published_at timestamptz, language text,
  content_text text, embedding vector(1536),
  hash text, created_at timestamptz DEFAULT now()
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title text, category text,
  first_seen_at timestamptz DEFAULT now(),
  last_updated_at timestamptz, importance_score int
);

CREATE TABLE event_articles (
  event_id uuid REFERENCES events(id),
  article_id uuid REFERENCES articles(id),
  similarity numeric, stance_score numeric,
  lean_reason text, PRIMARY KEY(event_id,article_id)
);

CREATE TABLE summaries (
  event_id uuid REFERENCES events(id),
  lang text, neutral_summary text,
  confidence numeric, updated_at timestamptz DEFAULT now(),
  PRIMARY KEY(event_id,lang)
);
```

---

## 8️⃣ DETAILED FEATURE SET

### 8.1 Core Features (Phase 1)

| Feature                             | Details                                                                                                                            | AI Components                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **RSS Ingestion**                   | Parse feeds (Ada Derana, NewsFirst, Daily Mirror, Tamil Guardian, Thinakkural, BBC Sinhala/Tamil, etc.). Fallback to HTML scraper. | –                                 |
| **Text Extraction & Normalization** | Clean HTML, detect language, strip ads and footers.                                                                                | Language detection model          |
| **Embedding & Storage**             | Compute vector → store in Supabase pgvector.                                                                                       | `text-embedding-3-large`          |
| **Event Clustering**                | Group similar articles (≥ 0.82 cosine sim).                                                                                        | Vector similarity + title SimHash |
| **Canonical Event Creation**        | Generate event title (LLM consensus).                                                                                              | GPT-4o mini                       |
| **Neutral Summary**                 | 4–6 sentence fact-based summary with citations.                                                                                    | GPT-4o mini                       |
| **Bias Detection**                  | LLM rates each article (−2 to +2) with reason.                                                                                     | Claude Sonnet classifier          |
| **Confidence Score**                | (#sources × reliability × diversity)/100.                                                                                          | Supabase function                 |
| **Tri-lingual Summaries**           | Native Sinhala + Tamil outputs from evidence.                                                                                      | GPT-4o mini                       |
| **Hourly Automation**               | Vercel Cron triggers pipeline.                                                                                                     | –                                 |
| **UI Cards / Event Pages**          | Next.js ISR pages with bias chips & logos.                                                                                         | –                                 |

---

### 8.2 Advanced Features (Phase 2–3)

| Category               | Feature                                                      | Description                                              |
| ---------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| **Transparency**       | “How AI Decided” Panel                                       | Show sources used, similarity scores, and LLM reasoning. |
| **Bias Radar**         | Radar visualization (sentiment, frame, omission, diversity). |                                                          |
| **Context Cards**      | Auto-generated explainer for entities (“13A”, “IMF Deal”).   |                                                          |
| **Audio Summaries**    | Daily briefs in 3 languages (TTS + Whisper).                 |                                                          |
| **Personalized Feed**  | Bias-balanced recommendations.                               |                                                          |
| **Public API**         | `/api/events`, `/api/articles`, `/api/search`.               |                                                          |
| **Newsletter Engine**  | Morning Digest email with AI curation.                       |                                                          |
| **Trend Explorer**     | Heatmap of topics/entities via NER.                          |                                                          |
| **Research Dashboard** | Institutional bias trends & downloads.                       |                                                          |
| **Moderation Loop**    | Human review for low confidence summaries.                   |                                                          |

---

## 9️⃣ AUTOMATION – VERCEL CRON JOBS

### vercel.json

```json
{
  "crons": [
    { "path": "/api/tasks/run-hourly", "schedule": "0 * * * *" }
  ]
}
```

### API Route (`/api/tasks/run-hourly.ts`)

```ts
import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";

export async function GET(req: Request) {
  if (req.headers.get("x-vercel-cron") !== "1")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await runPipeline();
  return NextResponse.json({ ok: true });
}
```

### Pipeline (`/lib/pipeline.ts`)

```ts
export async function runPipeline() {
  const sources = await getSources();
  const articles = await fetchNewArticles(sources);
  const embeddings = await embedArticles(articles);
  const clusters = await clusterArticles(embeddings);
  for (const cluster of clusters) {
    const summaryEN = await makeSummary(cluster, "en");
    const summarySI = await makeSummary(cluster, "si");
    const summaryTA = await makeSummary(cluster, "ta");
    await saveEventSummaries(cluster.id, { en: summaryEN, si: summarySI, ta: summaryTA });
  }
}
```

---

## 🔟 API ENDPOINT MAP

| Endpoint                | Method | Description                                      |
| ----------------------- | ------ | ------------------------------------------------ |
| `/api/tasks/run-hourly` | GET    | Cron trigger → ingest + summarize                |
| `/api/events`           | GET    | List events with filters (lang, category, since) |
| `/api/events/[id]`      | GET    | Get event summary + sources + bias               |
| `/api/search`           | GET    | Keyword/semantic search in Supabase              |
| `/api/stats`            | GET    | System metrics (confidence, articles count)      |
| `/api/subscribe`        | POST   | Newsletter subscription email                    |

---

## 1️⃣1️⃣ LLM PROMPT TEMPLATES

### 1. Neutral Summary

```
You are an impartial journalist. Summarize the key facts common across the following articles.
- Exclude speculation or adjectives.
- Highlight only verified facts mentioned by ≥ 2 sources.
Output 4–6 sentences ending with “Sources:” + list of sites.
Return plain text ≤ 800 chars.
```

### 2. Bias Detection

```
Analyze the tone and framing toward the main subject.
Score = −2 (critical) … +2 (favorable)
Explain why using word choice and focus of story.
Output JSON: {"lean_score": n, "reason": "..."}
```

### 3. Localization Prompt

```
Translate and localize the summary into [LANG].
Preserve facts and names exactly.
Use natural newsroom tone for Sri Lankan readers.
Avoid literal machine phrasing.
```

---

## 1️⃣2️⃣ UI / UX SPECIFICATION

### Home Page

* Neutral summary cards (Title, 5 lines, Confidence badge).
* Source logos + bias chips (red = critical, green = favorable).
* Language switcher persisting in cookie.
* Infinite scroll / pagination.

### Event Page

* Canonical title + updated timestamp.
* Neutral summary (top) + Bias Radar chart.
* “How AI Decided” expandable panel (show sources + reasoning).
* Related events below (via entity similarity).

### Search Page

* Combined semantic + keyword search.
* Filters: category, time range, confidence level.

### Newsletter Page

* Daily email subscribe box + preview sample.

---

## 1️⃣3️⃣ FOLDER / FILE STRUCTURE

```
/src
 ├─ /app
 │   ├─ page.tsx                # Home page
 │   ├─ [lang]/event/[id]/page.tsx
 │   ├─ /api
 │   │   ├─ /tasks/run-hourly.ts
 │   │   ├─ /events/route.ts
 │   │   ├─ /search/route.ts
 │   │   ├─ /stats/route.ts
 │   │   └─ /subscribe/route.ts
 │
 ├─ /lib
 │   ├─ supabaseClient.ts
 │   ├─ pipeline.ts
 │   ├─ embeddings.ts
 │   ├─ summarize.ts
 │   ├─ bias.ts
 │   ├─ cluster.ts
 │   ├─ rss.ts
 │   └─ localization.ts
 │
 ├─ /components
 │   ├─ EventCard.tsx
 │   ├─ BiasRadar.tsx
 │   ├─ SourceList.tsx
 │   ├─ LanguageSwitcher.tsx
 │   └─ ConfidenceBadge.tsx
 │
 ├─ /styles
 │   └─ globals.css
 └─ vercel.json
```

---

## 1️⃣4️⃣ MONITORING & LOGGING

* **Supabase Logs:** Ingestion + errors.
* **Vercel Analytics:** API latency & ISR times.
* **Error Alerts:** Email/Slack via Webhook for summary failures.
* **Metrics to track:**

  * Articles ingested/hour
  * Cluster count
  * Summaries generated
  * Confidence avg
  * Bias distribution

---

## 1️⃣5️⃣ SECURITY & ETHICS

* Respect robots.txt & copyright (quote only short snippets + link back).
* Filter explicit content & hate speech via OpenAI Moderation API.
* Always attribute sources visibly.
* Transparent disclaimer: “AI-generated neutral summary from multiple sources.”

---

## 1️⃣6️⃣ DEPLOYMENT WORKFLOW (VERCEL PLAN)

| Step | Tool                   | Action                                 |
| ---- | ---------------------- | -------------------------------------- |
| 1    | Vercel Cron            | Trigger `/api/tasks/run-hourly`        |
| 2    | Supabase Edge Function | Perform ingest and DB operations       |
| 3    | Next.js ISR            | Rebuild pages automatically every hour |
| 4    | Supabase Storage       | Backup HTML/text of articles           |
| 5    | Analytics              | Track latency and success metrics      |

---

## 1️⃣7️⃣ DEVELOPMENT ROADMAP

| Phase       | Weeks       | Milestones                                        |
| ----------- | ----------- | ------------------------------------------------- |
| **Phase 1** | 1–8 weeks   | Core pipeline + multilingual summaries + UI       |
| **Phase 2** | 9–16 weeks  | Transparency panels, Bias Radar, Newsletter       |
| **Phase 3** | 17–24 weeks | Audio summaries, Personalized feed, API dashboard |

---

## 1️⃣8️⃣ SUCCESS METRICS (AFTER LAUNCH)

| Metric               | Target (6 months) |
| -------------------- | ----------------- |
| Stories per hour     | ≥ 150             |
| Visitors per month   | ≥ 20 000          |
| Avg confidence score | ≥ 80 %            |
| Manual review rate   | < 5 %             |
| User retention       | ≥ 50 %            |

---

## 1️⃣9️⃣ LONG-TERM EXPANSION

* **Phase 4:** South Asia Bias Index (India, Maldives, Bangladesh).
* **Phase 5:** AI Anchor YouTube Briefs.
* **Phase 6:** Institutional partnerships (API licensing).
* **Phase 7:** Mobile App (React Native + offline reading).

---

## 2️⃣0️⃣ CONCLUSION

“SriLankaLens.ai” positions itself as **the world’s first tri-lingual AI-news intelligence platform for Sri Lanka**, offering:

* **Automated hourly updates**
* **Neutral & bias-scored summaries**
* **Multilingual trust layer**

---

Would you like me to follow this with a **“Technical Execution Blueprint”** (step-by-step implementation with API keys, Supabase setup commands, and LLM orchestration flow-charts)?
