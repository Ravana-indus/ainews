# SriLankaLens.ai — UI/UX Specification

**Scope:** Mobile‑first, SEO‑friendly, clean and professional UI/UX for tri‑lingual AI news platform (English, Sinhala, Tamil) with an accompanying Admin Panel. Optimized for Next.js on Vercel.

---

## 1) Product Principles
- **Clarity over clutter:** 1–2 primary actions per screen; visible hierarchy.
- **Trust & transparency:** Always show sources, timestamps, update history.
- **Mobile‑first:** Design from 360–400px width upward; progressive enhancement for tablet/desktop.
- **Accessible & local:** A11y AA+, Sinhala/Tamil first‑class typography & layouts.
- **SEO‑smart:** SSR/ISR pages, semantic HTML, schema.org markup, fast LCP.

---

## 2) Brand & Design System
### 2.1 Visual Language
- **Tone:** Neutral, modern, civic.
- **Color (WCAG‑friendly):**
  - Primary: `#0F172A` (Slate‑900)
  - Accent: `#2563EB` (Blue‑600)
  - Positive: `#16A34A`; Negative: `#DC2626`; Warning: `#F59E0B`
  - Surfaces: White `#FFFFFF`, Slate‑50 `#F8FAFC`, Slate‑100 `#F1F5F9`
  - Text: Slate‑900 for headings, Slate‑700 body, Slate‑500 meta
- **Elevation:** Soft shadows, rounded‑2xl on cards, 16–24px padding.

### 2.2 Typography (tri‑lingual)
- **English UI/Body:** Inter (fallback: system UI)
- **Sinhala:** Noto Sans Sinhala (fallback: Iskoola Pota)
- **Tamil:** Noto Sans Tamil (fallback: Latha)
- **Scale:**
  - Display: 28/36/48 (desktop) | 24/32 (mobile)
  - H1: 22/28; H2: 18/24; Body: 15/22; Small/meta: 13/18
- **Line‑height:** 1.5–1.7 for Sinhala/Tamil for legibility.

### 2.3 Spacing & Grid
- **Grid:** 4‑pt base; 16/24/32 spacing blocks.
- **Container widths:** 360–400 (mobile), 720 (tablet), 1024, 1280 (desktop).

### 2.4 Iconography & Data Viz
- Icons: Lucide (stroke 1.5px).
- Bias Radar/Badges: Simple shapes with color coding; ensure text labels (no color‑only encoding).

---

## 3) Information Architecture
### 3.1 Public Site Navigation
- **Top bar:** Logo • Language switch (EN | සි | த) • Search • Menu (☰)
- **Primary sections:** Home, Topics, Explore, Newsletter, About
- **Footer:** Sources, Methodology, Privacy, Terms, Contact

### 3.2 Admin Navigation
- **Dashboard** (health, counts, error rates)
- **Sources** (list/edit + RSS/scraper configs)
- **Events** (clusters, summaries, statuses)
- **Articles** (raw items & mappings)
- **QA/Moderation** (flags, edits, approvals)
- **Translations** (side‑by‑side review)
- **Settings** (roles, API keys, schedules)
- **Logs** (pipeline runs, alerts)

#### 3.2.1 Quick Shortcuts (Admin Home)
- One‑click access on `/admin` to: Pipeline Sync, News Ingestion, Sources, Events, Articles, Logs, QA, Settings, Ads, AI Endpoints, Translations, Dashboard.
- Controls: Run Full Pipeline, Classify (categories + newsworthiness), Flag Non‑News, Deduplicate (title/vector).

---

## 4) Frontend — Key Screens & Components

### 4.1 Home (Feed)
**Goal:** Fast scan of top events; switch language; trust at a glance.

**Layout (mobile):**
1. **Header**: Logo (left), Lang switch (center), Search (right icon).
2. **Top strip**: “Last updated 10:00 • Hourly” + Confidence average.
3. **Event Cards (infinite list):**
   - **Title** (2 lines, clamp)
   - **Neutral Summary** (3–4 lines, clamp)
   - **Source Row**: outlet logos (up to 4) + “+N more”
   - **Bias Chips**: −2..+2 (colored badges with tooltips)
   - **Meta**: Updated time • Category • Confidence badge
   - **CTA**: “Open event →”
4. **Newsletter CTA** (light card) and **Explore Topics** chips.

**Empty state:** “No fresh stories yet. Next update at HH:00.”

**Interactions:** Pull‑to‑refresh; infinite scroll; swipe back to top.

### 4.2 Event Details
**Goal:** Understand the story neutrally; compare coverage; see transparency.

**Layout (mobile):**
- **Hero:** Canonical title, Updated at, Confidence badge.
- **Neutral Summary (lang‑specific)**: 4–6 sentences.
- **How different outlets framed it:**
  - List of source tiles: outlet logo, headline, lean badge, 1‑line reason.
  - Toggle to expand full excerpt (max 2 lines per source) with link.
- **Bias & Neutrality Analytics**
  - Neutrality Gauge (semi‑donut) showing neutrality score.
  - Bias Tally Bars (−2..+2 distribution across sources).
  - Bias Radar (4‑axis: sentiment, frame, omission, diversity) with legend.
- **Sources section:** Logos + names + publish times; outbound links (nofollow + new tab).
- **Timeline:** “Developing → Update 1 → Correction” (if present).
- **Related events:** up to 6 chips.

**Sharing:** Native share (mobile), copy link button, X/FB/WhatsApp buttons.

### 4.3 Search & Explore
- **Global search** input with recent searches.
- **Results list**: event cards matching keyword/semantic query.
- **Filters:** Category, Date range, Confidence (slider), Language (content language).
- **Explore:** Trending Topics (entity chips), People, Places, Institutions.

### 4.4 Newsletter Signup
- **Simple form:** email + language preference.
- **Inline privacy:** “We’ll email daily at 7am. Unsubscribe anytime.”
- **Success state:** “Subscribed. Check your inbox.”

### 4.5 Static Pages
- **About/Methodology:** Plain, scannable typography; diagrams for pipeline & bias rubric.
- **Sources list:** All outlets with language & reliability score.

---

## 5) Frontend Components (Spec)

### 5.1 EventCard
- **Props:** `title`, `summary`, `updatedAt`, `confidence`, `sources[]`, `biasSummary[]`, `href`, `category`
- **States:** loading (skeleton), error, compact (list), full (grid)
- **Accessibility:** Card clickable area is whole container; focus ring; `aria-describedby` ties title to summary.

### 5.2 BiasChip
- **Scale:** −2, −1, 0, +1, +2
- **Color:** Critical (−) → red hues; Neutral → gray; Favorable (+) → green
- **Label:** Always text (e.g., “Critical −2”).

### 5.3 ConfidenceBadge
- **Ranges:** 0–49 (low, amber), 50–79 (medium, blue), 80–100 (high, green)
- **Tooltip:** Explains how computed.

### 5.4 SourceTile
- Logo, outlet name, time, outbound link, lean chip, reason (1 line).

### 5.5 LanguageSwitcher
- **Modes:** inline pill group (EN | සි | த); bottom sheet on mobile on tap.
- **Persistence:** cookie + localStorage; deep link preserves language.

### 5.6 Pagination / InfiniteList
- **Trigger:** IntersectionObserver on sentinel div.
- **Skeletons:** 3 placeholder cards.

### 5.7 Toasts & Notices
- Snackbar for network errors; retry action.

---

## 6) Admin Panel — Screens & Flows

### 6.1 Dashboard
- **KPI cards:** Articles ingested (24h), Events created, Summaries generated, Failures, Avg confidence
- **Charts:** Pipeline run time, Error rate, Bias distribution histogram
- **System status:** Last cron, Next cron, Embedding/LLM latency

### 6.2 Sources
- **List:** Name, domain, language, type (RSS/Scrape), reliability, enabled toggle
- **Add/Edit drawer:**
  - Basic: name, domain, language
  - Ingestion: RSS URL(s), CSS selectors (for scraper fallback), rate limits
  - Reliability score (0–1)
  - Test fetch (preview 3 latest)
- **Bulk actions:** Enable/disable, re‑ingest last N hours

### 6.3 Articles
- **Table:** Title, outlet, time, language, status (new/clustered), event link
- **Detail:** Raw HTML/text preview, extracted fields, embedding vector meta, links
- **Actions:** Re‑extract, re‑embed, blacklist URL

### 6.4 Events
- **List:** Canonical title, last updated, #articles, confidence, status (auto/human‑verified)
- **Detail (tabs):**
  - **Overview:** Canonical title, category, importance
  - **Sources:** list w/ lean scores & reasons
  - **Summaries:** EN/SI/TA editable fields + diff history
  - **Timeline:** updates log
  - **QA flags:** hallucination risk, low source agreement, legal sensitivity
- **Actions:**
  - Merge events (manual pair, batch)
  - Suggested merges (title and vector similarity with thresholds)
  - Preview similarity (Jaccard on title, cosine on centroid)
  - Apply suggestions (dry‑run or real) with auto recompute (summaries + bias)
  - Recompute summary/bias for a given event
  - Split event, archive, mark verified

### 6.5 QA / Moderation
- **Queue:** Items failing rules (e.g., confidence < 50, source disagreement > 0.4)
- **Triage actions:** Edit summary, adjust bias score (with reason), request re‑run, add note
- **Audit log:** Who changed what, when; diff view

### 6.6 Translations
- **Side‑by‑side editor:** EN | සි | த
- **Checks:** Length, numeric consistency, named entity consistency, forbidden phrases list
- **Actions:** Approve, send back to re‑generate, mark as “human verified”

### 6.7 Settings & Roles
- **Users/Roles:** Admin, Editor, QA, Viewer
- **API Keys:** LLM/Embeddings, Webhooks
- **Schedules:** Cron interval (read‑only if managed by Vercel), newsletter send time

### 6.8 Logs & Alerts
- **Pipeline runs:** duration, status, errors
- **Notifications:** Email/Slack webhook for failures, anomaly spikes

---

## 7) Interaction & Microcopy
- **Neutral language:** Avoid sensationalism in UI text.
- **Tooltips:** Short, factual explanations (e.g., “Lean: A directional indicator of tone based on wording and framing.”)
- **Empty states:** “Nothing here yet. Try changing filters.” with quick actions.
- **Error states:** Actionable advice: “Couldn’t load sources. Retry”

---

## 8) Accessibility (WCAG 2.1 AA)
- Color contrast ≥ 4.5:1 for text; 3:1 for large text and icons with labels.
- Focus visible on all interactive elements.
- Keyboard navigation: tab order mirrors visual order; skip‑to‑content link.
- ARIA roles/labels for cards, chips, charts.
- Screen reader: announce language changes `lang="en|si|ta"` at content root.

---

## 9) SEO & Performance
- **Semantic HTML:** `article`, `section`, `nav`, `time`.
- **Metadata:** Title (≤ 60 chars), meta description (≤ 155 chars), Open Graph, Twitter Cards.
- **Structured Data:** schema.org `NewsArticle` for event page; `ItemList` for feed; `Organization` for About.
- **URLs:**
  - Feed: `/[lang]/`
  - Event: `/[lang]/event/[slug]`
  - Topics: `/[lang]/topic/[entity]`
- **SSR/ISR:** 60‑minute revalidate; prefetch above‑the‑fold assets.
- **Core Web Vitals:** LCP < 2.5s, CLS < 0.1, TBT < 200ms.
- **Images:** Next/Image; `loading="lazy"`; responsive sizes; WebP/AVIF.

---

## 10) Internationalization (i18n)
- Use ICU message format for pluralization & variables.
- Store static copy in locale JSON: `en.json`, `si.json`, `ta.json`.
- Avoid hard‑coded text in components; support date/number formats per locale.
- Language switch persists; server serves language‑specific paths.

---

## 11) States & Edge Cases
- **No sources available:** Show maintenance banner; degrade gracefully.
- **Conflicting facts:** Display confidence warning; invite user to read sources.
- **Legal sensitivity:** Red banner and block social share until verified.
- **Offline (PWA optional):** Cache last 20 event pages for read‑only.

---

## 12) Component Library & Frontend Tech
- **Framework:** Next.js 14 App Router, React 19
- **Styling:** Tailwind CSS; CSS variables for theming
- **UI kit:** shadcn/ui components (Button, Drawer, Dialog, Tabs, Table)
- **Charts:** Recharts (Bias Radar)
- **Icons:** lucide‑react

---

## 13) Acceptance Criteria (Frontend)
1. Home feed loads above‑the‑fold content in < 1.5s on 4G.
2. Event page clearly shows sources, timestamps, and lean badges.
3. Language switch updates URL and content without full reload.
4. SEO lighthouse score ≥ 90 (mobile), a11y ≥ 95.
5. Screen reader can read cards in logical order, including bias labels.

## 14) Acceptance Criteria (Admin)
1. Editor can find and edit a summary (EN/SI/TA) and view diffs.
2. Moderator can approve/decline flagged item with audit trail.
3. Admin can add/edit a source and test its feed within the UI.
4. Dashboard shows last cron time and ingestion counts (24h).
5. Translations tool enforces entity/number consistency checks.

---

## 15) Sample Wireframe Descriptions (Mobile‑first)

**Home Card:**
- Top: Title (2 lines)
- Middle: 4‑line summary
- Bottom row: [Source logos] [Bias chips] [Updated time]
- Tap anywhere → Event page

**Event Page:**
- Title
- Meta row: Updated • Confidence
- Neutral summary block
- Sources list (accordion): each with logo, headline, lean badge, “Why” tooltip
- Related chips

**Admin Event Detail:**
- Tabs: Overview | Sources | Summaries | Timeline | Flags
- Summaries tab: EN/SI/TA in stacked editors with “Compare” toggle
- Actions: Approve, Re‑generate, Mark Verified

---

## 16) Content Guidelines
- **Neutral voice:** No subjective adjectives in summaries.
- **Timestamp format:** `10 Oct 2025, 10:00` (locale aware)
- **Source naming:** Official outlet names; always link to canonical URL.
- **Bias glossary:** Show definition modal explaining scoring rubric.

---

## 17) Analytics & Telemetry
- Track: page views, time on page, language usage, share clicks, newsletter signups.
- Admin: pipeline run durations, LLM error rates, manual override frequency.
- Privacy: anonymize IP; consent banner for tracking where required.

---

## 18) Roadmap Notes (UI/UX)
- Phase 2: Bias Radar, Transparency panel, Context Cards page type.
- Phase 3: Personalized feed + user settings (topics, bias exposure level).
- Phase 3: Audio briefs page with mini player + transcripts.

---

## 19) Checklist Before Launch
- [ ] Lighthouse (mobile) ≥ 90 performance / ≥ 95 a11y
- [ ] Schema.org validates (Rich Results Test)
- [ ] All images have `alt` text; charts have text equivalents
- [ ] 404/500 pages localized
- [ ] Favicon + app icons; theme‑color meta set
- [ ] Robots.txt & sitemap.xml per language
- [ ] Cookie/Privacy pages localized

---

### Appendix A — Schema.org Examples (Event page)
- `NewsArticle` with `headline`, `datePublished`, `dateModified`, `author` (outlet), `isBasedOn` (source URLs), `inLanguage`.
- `BreadcrumbList` for navigational context.

### Appendix B — Bias Scale Legend
- **−2 Critical**, **−1 Skeptical**, **0 Neutral**, **+1 Favourable**, **+2 Strongly favourable**. Always accompanied by 1‑line textual rationale.

---

**End of UI/UX Specification**



---

# Addendum v2 — Updated PRD + UI/UX (new requirements)

## Summary of New Additions
1) **Web‑scraping fallback** when no RSS/Atom is available (respect robots.txt, rate limits, and anti‑bot ethics).
2) **Powerful Backend (Admin) Settings** to centrally manage ingestion, scraping rules, LLM/embedding knobs, bias rubric, feature flags, and roles.
3) **Dev AI Agent (MCP)** integrated to operate Supabase (schema, migrations, jobs) and use Chrome DevTools automation for scraper authoring/debugging.

---

## 1) Ingestion: Web‑Scraping Fallback (Product + Tech)

### Product Requirements
- System must ingest articles from outlets **without RSS** by using configurable scrapers per domain.
- Editors can **add/edit scraping rules** in Admin without code deploys.
- Visual **Selector Builder** with live preview; save CSS/XPath selectors for title, author, publish time, content, image.
- **Polite crawling**: honor `robots.txt`, `nofollow`, per‑site rate limit, crawl window.
- **Anti‑duplication**: URL canonicalization, content hashing.

### Technical Spec
- **Fetcher**: Playwright headless (primary) → Axios/cheerio (secondary) with user‑agent rotation.
- **Normalizer**: Readability-like extraction + site‑specific overrides.
- **Selector priority**: Site selectors → generic heuristics (e.g., `article`, `h1`, `time` with datetime)
- **Rate limits**: Per‑domain concurrency (default 1), backoff on 429/5xx, daily cap.
- **Robots**: Parse and cache per domain; deny if disallowed. Configurable allow‑list for publishers with permission.
- **Detection**: Language detection, date parsing, canonical `<link>`, OpenGraph fallback.

### DB additions
```sql
ALTER TABLE sources ADD COLUMN scrape_enabled boolean DEFAULT false;
ALTER TABLE sources ADD COLUMN rate_limit_per_minute int DEFAULT 6;

CREATE TABLE scrape_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  title_selector text, author_selector text, time_selector text,
  content_selectors text[], remove_selectors text[],
  pagination_selector text, next_page_selector text,
  test_url text, last_tested_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
```

### UI/UX (Admin)
- **Sources > Scraper Config Drawer**
  - Toggles: *Enable scraping if no RSS*, *Respect robots*, *Use JS rendering (Playwright)*
  - Fields: selectors with **Preview** button → opens **Live DOM Viewer** (see DevTools section)
  - Test run → shows extracted fields and cleanliness score
- **Scraper Health**: badge per source (Last success, Avg ms, Error rate)

---

## 2) Powerful Backend Settings (Admin)

### Product Requirements
A first‑class **Settings Hub** controlling ingestion, summarization, clustering, bias, languages, and rollout:
- **Ingestion**: global crawl window, per‑domain concurrency, user‑agent pool, retries, HTML snapshot retention.
- **LLM/Embeddings**: model choices, temperatures, max tokens, cost guardrails (daily cap), fallback order.
- **Clustering**: similarity thresholds (title SimHash, embedding cosine), time window (e.g., 48h), min sources to form event.
- **Bias Rubric**: weight sliders (Sentiment/Frame/Omission/Diversity), labels text.
- **Languages**: enable/disable SI/TA/EN output, back‑translation QA toggle, numerals style.
- **Feature Flags**: Bias Radar, Transparency Panel, Audio Briefs, Personalized Feed.
- **Security**: roles/permissions, API keys (masked), IP allowlist for Admin.
- **Scheduling**: read‑only Vercel cron; internal job cadence (e.g., retry every 10m for failed pulls).

### Technical Spec
- **Settings table** (singleton by key) with typed JSON and audit log.
```sql
CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text, entity_id text, action text, before jsonb, after jsonb,
  actor_id uuid, created_at timestamptz DEFAULT now()
);
```
- **Config cache** in Edge KV (or memory) with ETag + 1‑min TTL; Admin save triggers cache bust.

### UI/UX (Admin Settings Hub)
- **Tabbed layout**: Ingestion • LLM & Embeddings • Clustering • Bias Rubric • Languages • Feature Flags • Security • Schedules • Billing/Usage
- **Controls**: sliders with numeric input, toggles with helper copy, danger‑zone for resets.
- **Preview**: show *effective thresholds* and example clustering outcomes.

---

## 3) Dev AI Agent (MCP) — Supabase + Chrome DevTools

### Goals
- Empower developers/editors to **ask the agent** to perform DB ops (schema changes, migrations, vector maintenance) and **author/debug scrapers** using a guided DevTools session — all with audit trails and approvals.

### Capabilities
1. **Supabase MCP**
   - Read/describe schema, propose migrations, generate SQL (safe mode by default)
   - Manage pgvector indexes, vacuum/analyze heavy tables
   - Create RLS policies/templates for Admin views
   - Run **safe queries** against views; destructive ops require approval
   - Health checks: index bloat, slow queries, row counts, storage growth
2. **Chrome DevTools (CDP)**
   - Navigate to a test URL, render JS, expose DOM, compute selectors
   - Extract preview data using candidate selectors; suggest robust alternatives
   - Record network requests; detect paywalls/anti‑bot signals; propose backoff

### Workflow & Safeguards
- **Chat UI (Admin > Dev Agent):** prompt + context pickers (Source, Event, Table)
- **Propose → Review → Execute**
  - Agent generates a *Plan* (diffs, SQL, selector changes) → human approval → execution
- **Sandbox first:** run against staging schema (`_stg`) or snapshot, then promote
- **Audit log:** full prompt, plan, SQL, results, actor

### UI/UX (Admin)
- **Dev Agent Console**
  - Left: conversation & suggested actions (chips: “Create pgvector index”, “Raise cosine threshold”) 
  - Right tabs: *Plan*, *SQL/Migration*, *DOM Preview*, *Run Logs*
  - Buttons: *Test on staging*, *Request Approval*, *Execute*
- **DOM Preview Panel (CDP)**: live page render, click‑to‑select element → auto‑fill selector fields; show extracted text preview

### MCP Integration Notes
- Register **MCP servers**: `supabase` and `chromedevtools` in config; tokens in Admin > Settings > API Keys
- Permissions: Only **Admin/DevOps** can execute; Editors can *generate plans* but not run

---

## 4) Pipeline & API Updates

### Pipeline
- **Fetch phase**: Try RSS → if none or stale, attempt Scraper (Playwright → Cheerio fallback)
- **Safety**: robots check, per‑domain limiter, JS render timeout, fingerprint rotation
- **Outputs**: store `raw_html` snapshot (optional), extraction provenance (`rss` | `scrape`)

### DB
```sql
ALTER TABLE articles ADD COLUMN ingestion_method text CHECK (ingestion_method IN ('rss','scrape'));
ALTER TABLE articles ADD COLUMN raw_snapshot_url text; -- Supabase Storage key
```

### Public API (no breaking changes)
- `/api/events` accepts `ingestion=any|rss|scrape` filter
- `/api/sources` exposes `scrape_enabled`, health metrics

---

## 5) Frontend UI/UX deltas (Public)
- **Event Card meta** adds a tiny provenance dot with tooltip: “From RSS” / “From Scraper (cleaned)”
- **Methodology page** updated with scraping ethics, robots policy, rate‑limit policy

---

## 6) Admin UI/UX — New/Updated Screens

### A) **Scraper Studio**
- Route: **Admin → Sources → Configure Scraper**
- Panels: *Settings* (toggles, rate limits), *Selectors*, *DOM Preview (CDP)*, *Test Output*
- Actions: Save draft, Validate selectors, Run sample (staging), Publish

### B) **Dev Agent Console**
- Route: **Admin → Dev Agent**
- Tabs: *Chat*, *Plan*, *SQL/Migration*, *DOM Preview*, *Run Logs*, *Audit*
- Primary CTA: **Request Approval** (disabled unless Plan is valid)

### C) **Settings Hub** (expanded)
- Feature Flags: *Enable Dev Agent*, *Enable Scraper Studio*, *Allow JS rendering*, *Snapshot raw HTML*
- Cost Guardrails: show est. token/$ per summarization; hard limit & notification email

---

## 7) Acceptance Criteria (delta)
- When RSS is absent, system successfully scrapes at least 3 test outlets and produces valid articles with ≥ 90% field extraction accuracy.
- Admin can add a new domain scraper via UI and publish without code.
- Dev Agent can propose a safe pgvector index and execute it after approval; audit entry is recorded.
- Chrome DevTools preview enables **click‑to‑selector** and test extraction with >95% precision on selected page.
- Settings changes are auditable and reflected in pipeline within 1 minute.

---

## 8) Security, Compliance, Ethics (delta)
- Strict robots.txt compliance by default; explicit allow‑list overrides require legal review checkbox.
- Per‑site **rate‑limit** + crawl window (e.g., 9am–9pm) configurable.
- Publisher partnership mode: API tokens preferred; scraper auto‑disables when official API available.
- Dev Agent destructive actions require **2‑step approval** (requester ≠ approver).

---

## 9) Roadmap Impact
- Phase 1 expands to include **Scraper Studio** minimal version.
- Phase 2 adds **Dev Agent Console** (generate plans); Phase 3 enables controlled execution in production with approvals.

---

**This addendum updates the previously defined PRD & UI/UX and is effective immediately.**
### 6.9 Pipeline Sync (Manual Orchestration)
- One‑click button runs: Ingestion (all enabled sources) → Embeddings → Clustering → Summaries → Bias → Classification → Dedup (title + vector).
- Shows ingestion metrics (per‑source created/errors) and stage counts (embedded, events, summaries, bias, categories, dedup merges).

### 6.10 Non‑News Handling
- Bulk flag events as non‑news (is_news=false) via heuristics (min sources, summary presence) or manual selection.

---

## 11) Backend Pipeline — Stages (for UI/UX Awareness)
1. Ingestion: fetch RSS or scrape fallback; store articles only (no per‑article events)
2. Embeddings: compute vectors for new articles
3. Clustering: group similar articles into a single event; generate canonical title (LLM)
4. Summarization: generate EN summary and auto‑translate to SI/TA; save summaries
5. Bias: detect lean per source coverage and store reasons
6. Classification: assign category; set `is_news`
7. Deduplication: merge duplicates by title similarity and vector centroid similarity

Notes:
- Summarization fetches full page text when article content is sparse to strengthen combined detail.
- On new event creation and on merges, summaries and bias are recomputed.

