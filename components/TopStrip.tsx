"use client";
import ConfidenceBadge from './ConfidenceBadge';
import { useLang } from './LanguageProvider';
import { t } from '../lib/messages';

export default function TopStrip({ lastUpdated, avgConfidence }: { lastUpdated: string; avgConfidence: number }) {
  const { lang } = useLang();
  return (
    <section className="text-sm text-slate-700 mb-4 flex items-center justify-between" aria-live="polite">
      <div>{t('lastUpdated', lang)} {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {t('hourly', lang)}</div>
      <div className="flex items-center gap-2"><span className="text-slate-500">{t('avgConfidence', lang)}</span> <ConfidenceBadge value={avgConfidence} /></div>
    </section>
  );
}
