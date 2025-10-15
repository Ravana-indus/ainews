"use client";
import ConfidenceBadge from './ConfidenceBadge';
import { useLang } from './LanguageProvider';
import { t } from '../lib/messages';
import type { Lang } from '../lib/messages';

const localeMap: Record<Lang, string> = { en: 'en-US', si: 'si-LK', ta: 'ta-LK' };

export default function TopStrip({ lastUpdated, avgConfidence, langOverride }: { lastUpdated: string; avgConfidence: number; langOverride?: Lang }) {
  const { lang: ctxLang } = useLang();
  const lang = langOverride ?? ctxLang;
  const formattedTime = (() => {
    try {
      return new Intl.DateTimeFormat(localeMap[lang], {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(lastUpdated));
    } catch {
      return new Date(lastUpdated).toLocaleTimeString();
    }
  })();
  return (
    <section className="text-sm text-slate-700 mb-4 flex items-center justify-between" aria-live="polite">
      <div>
        {t('lastUpdated', lang)} {formattedTime} • {t('hourly', lang)}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500">{t('avgConfidence', lang)}</span> <ConfidenceBadge value={avgConfidence} />
      </div>
    </section>
  );
}
