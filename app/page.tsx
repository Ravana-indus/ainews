import Header from '../components/Header';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import TopStrip from '../components/TopStrip';
import { fetchEvents } from '../lib/data';
import { fetchLatestArticles } from '../lib/data';
import { cookies } from 'next/headers';
import { kpi } from '../lib/mocks';
import AdsPlaceholder from '../components/AdsPlaceholder';
import { getAdSettingsFromCookieHeader } from '../lib/ads';
import { Fragment } from 'react';
import { t } from '../lib/messages';

export const revalidate = 3600;
export default async function HomePage({ searchParams }: { searchParams?: Record<string, string> }) {
  const cookieStore = cookies();
  const langCookie = cookieStore.get('lang')?.value as 'en' | 'si' | 'ta' | undefined;
  const lang = langCookie && (langCookie === 'en' || langCookie === 'si' || langCookie === 'ta') ? langCookie : 'en';
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const adSettings = getAdSettingsFromCookieHeader(cookieHeader);
  const selectedCategory = searchParams?.category || undefined;
  const items = await fetchEvents(lang, selectedCategory).catch(() => [] as any[]);
  const latest = await fetchLatestArticles(3).catch(() => [] as any[]);
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
      {latest.length > 0 && (
        <section className="mb-4">
          <div className="text-sm font-semibold mb-2">Latest from sources</div>
          <ul>
            {latest.map((a: any, i: number) => (
              <li key={i} className="text-sm mb-2">
                <a href={a.url} target="_blank" rel="noopener nofollow" className="text-blue-600">{a.title}</a>
                <span className="text-xs text-slate-600"> • {new Date(a.publishedAt).toLocaleString()} {a.sourceName ? `• ${a.sourceName}` : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div aria-label="Latest events">
        {items.map((evt, idx) => (
          <Fragment key={evt.id}>
            <div className="mb-4"><EventCard evt={evt} lang={lang} /></div>
            {adSettings.enabled && adSettings.feedFrequency > 0 && (idx + 1) % adSettings.feedFrequency === 0 && (
              <div className="my-6"><AdsPlaceholder position="inline" /></div>
            )}
          </Fragment>
        ))}
      </div>
      <section className="mt-6">
        <div className="rounded-2xl border p-4 bg-slate-50">
          <div className="font-semibold">{t('subscribeTitle', lang)}</div>
          <p className="text-sm text-slate-700">{t('subscribeDesc', lang)}</p>
        </div>
      </section>
      <section className="mt-4">
        <div className="text-sm font-semibold mb-2">{t('exploreTopics', lang)}</div>
        <div className="flex gap-2 flex-wrap">
          {['Politics','Economy','Health','Education','Security','Environment','Transport','Technology','Sports','Local','International'].map((c) => (
            <a key={c} href={`/?category=${encodeURIComponent(c)}`} className={`px-2 py-1 text-xs rounded-full ${selectedCategory === c ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{c}</a>
          ))}
          {selectedCategory && (
            <a href="/" className="px-2 py-1 text-xs bg-slate-100 rounded-full">Clear</a>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
