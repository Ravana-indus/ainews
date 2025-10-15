import Header from '../components/Header';
import Footer from '../components/Footer';
import TopStrip from '../components/TopStrip';
import { fetchEvents, fetchLatestArticles } from '../lib/data';
import { cookies } from 'next/headers';
import { kpi, type LanguageCode, type EventItem } from '../lib/mocks';
import { getAdSettingsFromCookieHeader } from '../lib/ads';
import { t } from '../lib/messages';
import EventFeed from '../components/EventFeed';

export const revalidate = 3600;
export default async function HomePage({ searchParams }: { searchParams?: Record<string, string> }) {
  const cookieStore = cookies();
  const langCookie = cookieStore.get('lang')?.value as LanguageCode | undefined;
  const lang: LanguageCode = langCookie && (langCookie === 'en' || langCookie === 'si' || langCookie === 'ta') ? langCookie : 'en';
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const adSettings = getAdSettingsFromCookieHeader(cookieHeader);
  const selectedCategory = searchParams?.category || undefined;
  const items = await fetchEvents(lang, selectedCategory).catch(() => [] as EventItem[]);
  const latest = await fetchLatestArticles(3).catch(() => [] as any[]);
  const localeMap: Record<LanguageCode, string> = { en: 'en-US', si: 'si-LK', ta: 'ta-LK' };
  const lastUpdatedTime = items[0]?.updatedAt ?? new Date().toISOString();
  const nextUpdate = (() => {
    const d = new Date(lastUpdatedTime);
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  })();
  const nextUpdateLabel = new Intl.DateTimeFormat(localeMap[lang], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(nextUpdate);

  return (
    <main id="content" className="mx-auto max-w-screen-sm p-4">
      {/* JSON-LD ItemList for feed */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: items.map((e: any, i: number) => ({ '@type': 'ListItem', position: i + 1, url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/event/${e.id}` })),
      }) }} />
      <Header />
      <TopStrip lastUpdated={lastUpdatedTime} avgConfidence={kpi.avgConfidence} langOverride={lang} />
      {latest.length > 0 && (
        <section className="mb-4" aria-labelledby="latest-sources">
          <h2 id="latest-sources" className="mb-2 text-sm font-semibold text-slate-800">
            {t('latestFromSources', lang)}
          </h2>
          <ul className="space-y-2">
            {latest.map((a: any, i: number) => (
              <li key={i} className="text-sm leading-relaxed">
                <a href={a.url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-blue-600">
                  {a.title}
                </a>
                <span className="block text-xs text-slate-600">
                  {`${new Intl.DateTimeFormat(localeMap[lang], { hour: '2-digit', minute: '2-digit' }).format(new Date(a.publishedAt))}`}
                  {a.sourceName ? ` • ${a.sourceName}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-600" role="status">
          {t('noStories', lang)} {nextUpdateLabel}.
        </p>
      ) : (
        <section aria-label="Latest events" className="mt-2">
          <EventFeed events={items} lang={lang} adSettings={adSettings} />
        </section>
      )}
      <section className="mt-6">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="font-semibold">{t('subscribeTitle', lang)}</div>
          <p className="text-sm text-slate-700">{t('subscribeDesc', lang)}</p>
        </div>
      </section>
      <section className="mt-4">
        <div className="mb-2 text-sm font-semibold text-slate-800">{t('exploreTopics', lang)}</div>
        <div className="flex flex-wrap gap-2">
          {['Politics','Economy','Health','Education','Security','Environment','Transport','Technology','Sports','Local','International'].map((c) => (
            <a
              key={c}
              href={`/?category=${encodeURIComponent(c)}`}
              className={`rounded-full px-2 py-1 text-xs transition-colors ${selectedCategory === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {c}
            </a>
          ))}
          {selectedCategory && (
            <a href="/" className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
              {t('clearFilters', lang)}
            </a>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
