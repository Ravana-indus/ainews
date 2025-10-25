import * as React from 'react';
import Link from 'next/link';
import { fetchEventById } from '../../../lib/data';
import ConfidenceBadge from '../../../components/ConfidenceBadge';
import SourceTile from '../../../components/SourceTile';
import BiasRadar from '../../../components/BiasRadar';
import NeutralityGauge from '../../../components/NeutralityGauge';
import BiasBars from '../../../components/BiasBars';
import Timeline from '../../../components/Timeline';
import TransparencyPanel from '../../../components/TransparencyPanel';
import ShareButtons from '../../../components/ShareButtons';
import { cookies } from 'next/headers';
import AdsPlaceholder from '../../../components/AdsPlaceholder';
import { getAdSettingsFromCookieHeader } from '../../../lib/ads';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import { t } from '../../../lib/messages';
import { getSiteSettingsFromCookieHeader } from '../../../lib/settings';

export const revalidate = 3600;
type Params = { params: { id: string } };
export default async function EventPage({ params, searchParams }: { params: { id: string }, searchParams?: Record<string, string> }) {
  const cookieStore = cookies();
  const langQuery = searchParams?.lang as 'en' | 'si' | 'ta' | undefined;
  const langCookie = cookieStore.get('lang')?.value as 'en' | 'si' | 'ta' | undefined;
  const lang = (langQuery && (langQuery === 'en' || langQuery === 'si' || langQuery === 'ta'))
    ? langQuery
    : (langCookie && (langCookie === 'en' || langCookie === 'si' || langCookie === 'ta') ? langCookie : 'en');
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const adSettings = getAdSettingsFromCookieHeader(cookieHeader);
  const siteSettings = getSiteSettingsFromCookieHeader(cookieHeader);
  const evt = await fetchEventById(params.id, lang).catch(() => null);
  if (!evt) {
    return (
      <main className="mx-auto max-w-screen-sm p-4">
        <p className="text-slate-900 dark:text-white">Event not found.</p>
        <Link className="text-blue-600 dark:text-blue-400" href="/">Back</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <header className="flex items-center justify-between mb-4">
        <Link href="/" className="text-blue-600 dark:text-blue-400">{t('back', lang)}</Link>
        <LanguageSwitcher />
      </header>
  <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{evt.title}</h1>
  {/* JSON-LD for NewsArticle */}
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: evt.title,
    datePublished: evt.updatedAt,
    dateModified: evt.updatedAt,
    inLanguage: lang,
    isBasedOn: evt.sources.map((s: any) => s.url),
  }) }} />
  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Updated {new Date(evt.updatedAt).toLocaleString()} • <ConfidenceBadge value={evt.confidence} /></div>
  <p className="mt-4 text-slate-800 dark:text-slate-200">{evt.summary[lang]}</p>
  <section className="mt-4">
    <h2 className="font-semibold mb-2 text-slate-900 dark:text-white">Detailed</h2>
    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line">{evt.detail[lang]}</p>
  </section>
      <section className="mt-6">
        <h2 className="font-semibold mb-2 text-slate-900 dark:text-white">{t('outletsFramed', lang)}</h2>
        <ul>
          {evt.sources.map((s: any) => (
            <SourceTile
              key={s.sourceId}
              headline={s.headline}
              lean={s.lean}
              reason={s.reason}
              url={s.url}
              sourceName={s.sourceName}
              logoUrl={s.sourceLogo}
            />
          ))}
        </ul>
      </section>
      {siteSettings.showBiasRadar && (
        <section className="mt-6">
          <h2 className="font-semibold mb-2 text-slate-900 dark:text-white">{t('biasRadar', lang)}</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Neutrality</div>
              <NeutralityGauge score={evt.confidence} />
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Bias Tally</div>
              <BiasBars counts={{
                '-2': evt.biasSummary.filter((b: any) => b.score === -2).length,
                '-1': evt.biasSummary.filter((b: any) => b.score === -1).length,
                '0': evt.biasSummary.filter((b: any) => b.score === 0).length,
                '1': evt.biasSummary.filter((b: any) => b.score === 1).length,
                '2': evt.biasSummary.filter((b: any) => b.score === 2).length,
              }} />
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Radar</div>
              <BiasRadar values={{
                sentiment: Math.max(0, Math.min(100, 50 + (evt.biasSummary.filter((b: any) => b.score > 0).length - evt.biasSummary.filter((b: any) => b.score < 0).length) * 15)),
                frame: Math.max(0, Math.min(100, 60)),
                omission: Math.max(0, Math.min(100, 70 - (evt.sources.length < 3 ? 20 : 0))),
                diversity: Math.max(0, Math.min(100, Math.round((evt.sources.length / 6) * 100))),
              }} />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">{t('legendBias', lang)}</div>
        </section>
      )}
      {adSettings.enabled && adSettings.eventInline && <div className="mt-6"><AdsPlaceholder position="inline" /></div>}
      {siteSettings.showTransparencyPanel && <TransparencyPanel sources={evt.sources} />}
      <section className="mt-6">
        <h2 className="font-semibold mb-2 text-slate-900 dark:text-white">{t('related', lang)}</h2>
        <div className="flex gap-2 flex-wrap">
          {evt.category && <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 dark:text-slate-200 rounded-full">{evt.category}</span>}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-semibold mb-2 text-slate-900 dark:text-white">{t('share', lang)}</h2>
        <ShareButtons />
      </section>
      <section className="mt-6">
        <h2 className="font-semibold mb-2 text-slate-900 dark:text-white">{t('timeline', lang)}</h2>
        <Timeline steps={[
          { label: 'Developing', time: '08:30' },
          { label: 'Update 1', time: '09:15' },
          { label: 'Correction', time: '10:00' },
        ]} />
      </section>
    </main>
  );
}
