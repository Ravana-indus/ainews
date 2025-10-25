export const revalidate = 600;

import Header from '../components/Header';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import TopStrip from '../components/TopStrip';
import { fetchEvents, fetchLatestArticles, fetchCategories } from '../lib/data';
import { cookies } from 'next/headers';
import { kpi } from '../lib/mocks';
import AdsPlaceholder from '../components/AdsPlaceholder';
import { getAdSettingsFromCookieHeader } from '../lib/ads';
import { Fragment } from 'react';
import { t } from '../lib/messages';

export default async function HomePage({ searchParams }: { searchParams?: Record<string, string> }) {
  const cookieStore = cookies();
  const langCookie = cookieStore.get('lang')?.value as 'en' | 'si' | 'ta' | undefined;
  const lang = langCookie && (langCookie === 'en' || langCookie === 'si' || langCookie === 'ta') ? langCookie : 'en';
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const adSettings = getAdSettingsFromCookieHeader(cookieHeader);

  const selectedCategory = searchParams?.category || undefined;
  const sortBy = (searchParams?.sort as 'updated' | 'published' | 'category') || 'updated';
  const showDuplicates = searchParams?.duplicates === 'true';

  // Fetch stories with options
  const items = await fetchEvents(lang, {
    category: selectedCategory,
    sortBy,
    removeDuplicates: !showDuplicates
  }).catch(() => [] as any[]);

  const latest = await fetchLatestArticles(3).catch(() => [] as any[]);
  const categories = await fetchCategories().catch(() => [] as any[]);

  // Group stories by category for category view
  const groupedByCategory: { [key: string]: any[] } = {};
  if (sortBy === 'category' && !selectedCategory) {
    items.forEach(item => {
      const cat = item.category || 'General';
      if (!groupedByCategory[cat]) {
        groupedByCategory[cat] = [];
      }
      groupedByCategory[cat].push(item);
    });
  }

  const displayMode = sortBy === 'category' && !selectedCategory ? 'grouped' : 'list';

  return (
    <main className="mx-auto max-w-screen-sm p-4">
      {/* JSON-LD ItemList for feed */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: items.map((e: any, i: number) => ({ '@type': 'ListItem', position: i + 1, url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/event/${e.id}` })),
      }) }} />

      <Header />
      <TopStrip lastUpdated={items[0]?.updatedAt ?? new Date().toISOString()} avgConfidence={kpi.avgConfidence} />

      {/* Sorting and Filter Options */}
      <section className="mb-4 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold dark:text-white">Display Options</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">{items.length} stories</div>
        </div>

        {/* Sort Options */}
        <div className="mb-3">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Sort by:</div>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`/?sort=updated${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${sortBy === 'updated' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
            >
              Latest Updated
            </a>
            <a
              href={`/?sort=published${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${sortBy === 'published' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
            >
              Recently Published
            </a>
            <a
              href="/?sort=category"
              className={`px-3 py-1 text-xs rounded-full transition-colors ${sortBy === 'category' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
            >
              By Category
            </a>
          </div>
        </div>

        {/* Duplicate Toggle */}
        <div className="mb-3">
          <a href={`/?${new URLSearchParams({
            ...(sortBy !== 'updated' && { sort: sortBy }),
            ...(selectedCategory && { category: selectedCategory }),
            ...(showDuplicates ? {} : { duplicates: 'true' })
          }).toString()}`} className="flex items-center gap-2 text-xs cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <input
              type="checkbox"
              checked={showDuplicates}
              readOnly
              className="rounded pointer-events-none dark:bg-slate-700 dark:border-slate-600"
            />
            <span className="text-slate-700 dark:text-slate-300">Show duplicate stories</span>
          </a>
        </div>

        {/* Category Filter */}
        <div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Filter by category:</div>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`/?sort=${sortBy}`}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
            >
              All ({items.length})
            </a>
            {categories.slice(0, 10).map((cat) => (
              <a
                key={cat.name}
                href={`/?category=${encodeURIComponent(cat.name)}&sort=${sortBy}`}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedCategory === cat.name ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
              >
                {cat.name} ({cat.count})
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Latest from Sources */}
      {latest.length > 0 && (
        <section className="mb-4">
          <div className="text-sm font-semibold mb-2 dark:text-white">Latest from sources</div>
          <ul>
            {latest.map((a: any, i: number) => (
              <li key={i} className="text-sm mb-2">
                <a href={a.url} target="_blank" rel="noopener nofollow" className="text-blue-600 dark:text-blue-400 hover:underline">{a.title}</a>
                <span className="text-xs text-slate-600 dark:text-slate-400"> • {new Date(a.publishedAt).toLocaleString()} {a.sourceName ? `• ${a.sourceName}` : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Stories Display */}
      <div aria-label="Latest events">
        {displayMode === 'grouped' ? (
          // Grouped by Category View
          Object.entries(groupedByCategory).map(([category, categoryItems]) => (
            <div key={category} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{category}</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">{categoryItems.length} stories</span>
              </div>
              {categoryItems.map((evt, idx) => (
                <Fragment key={evt.id}>
                  <div className="mb-4"><EventCard evt={evt} lang={lang} /></div>
                  {adSettings.enabled && adSettings.feedFrequency > 0 && (idx + 1) % adSettings.feedFrequency === 0 && (
                    <div className="my-6"><AdsPlaceholder position="inline" /></div>
                  )}
                </Fragment>
              ))}
            </div>
          ))
        ) : (
          // List View
          items.map((evt, idx) => (
            <Fragment key={evt.id}>
              <div className="mb-4"><EventCard evt={evt} lang={lang} /></div>
              {adSettings.enabled && adSettings.feedFrequency > 0 && (idx + 1) % adSettings.feedFrequency === 0 && (
                <div className="my-6"><AdsPlaceholder position="inline" /></div>
              )}
            </Fragment>
          ))
        )}
      </div>

      {/* Info Section */}
      {items.length === 0 && (
        <div className="text-center py-8 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
          <div className="text-slate-600 dark:text-slate-400 mb-2">No stories found</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedCategory ? (
              <>No stories in {selectedCategory} category. <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">View all stories</a></>
            ) : (
              'No stories available at this time.'
            )}
          </div>
        </div>
      )}

      <section className="mt-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800">
          <div className="font-semibold dark:text-white">{t('subscribeTitle', lang)}</div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{t('subscribeDesc', lang)}</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
