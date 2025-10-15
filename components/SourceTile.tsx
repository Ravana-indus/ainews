"use client";
import BiasChip from './BiasChip';
import { useLang } from './LanguageProvider';
import { t } from '../lib/messages';

export default function SourceTile({
  headline,
  lean,
  reason,
  url,
  sourceName,
  logoUrl,
  publishedAt,
}: {
  headline: string;
  lean: -2 | -1 | 0 | 1 | 2;
  reason: string;
  url: string;
  sourceName?: string;
  logoUrl?: string | null;
  publishedAt?: string;
}) {
  const logo = logoUrl || '/logos/placeholder.png';
  const { lang } = useLang();
  const localeMap = { en: 'en-US', si: 'si-LK', ta: 'ta-LK' } as const;
  const publishedLabel = publishedAt
    ? (() => {
        try {
          return new Intl.DateTimeFormat(localeMap[lang], {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(publishedAt));
        } catch {
          return new Date(publishedAt).toLocaleTimeString();
        }
      })()
    : undefined;

  return (
    <li className="mb-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={sourceName || ''} className="mt-0.5 h-6 w-6 rounded object-cover" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">{headline}</div>
            <div className="mt-1 text-xs text-slate-600">{reason}</div>
          </div>
        </div>
        <BiasChip score={lean} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {sourceName && <span className="font-medium text-slate-700">{sourceName}</span>}
        {publishedLabel && <span aria-label={`Published at ${publishedLabel}`}>{publishedLabel}</span>}
        <span aria-hidden="true">•</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-sm font-medium text-blue-600"
        >
          {t('readSource', lang)}
        </a>
      </div>
    </li>
  );
}
