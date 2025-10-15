import Link from 'next/link';
import BiasChip from './BiasChip';
import ConfidenceBadge from './ConfidenceBadge';
import type { EventItem, LanguageCode } from '../lib/mocks';
import { t } from '../lib/messages';

const localeMap: Record<LanguageCode, string> = {
  en: 'en-US',
  si: 'si-LK',
  ta: 'ta-LK',
};

function formatTime(value: string, lang: LanguageCode) {
  try {
    return new Intl.DateTimeFormat(localeMap[lang], {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (err) {
    return new Date(value).toLocaleTimeString();
  }
}

export default function EventCard({ evt, lang = 'en' }: { evt: EventItem; lang?: LanguageCode }) {
  const summaryId = `evt-${evt.id}-summary`;
  const titleId = `evt-${evt.id}-title`;
  const summaryText = (evt.summary?.[lang] || evt.summary?.en || '').trim();
  const sources = Array.isArray(evt.sources) ? evt.sources.slice(0, 4) : [];
  const remainingSources = Math.max(0, (evt.sources?.length || 0) - sources.length);
  const updatedLabel = formatTime(evt.updatedAt, lang);

  return (
    <Link
      href={`/event/${evt.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      aria-labelledby={titleId}
      aria-describedby={summaryId}
    >
      <article>
        <header>
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {evt.title}
          </h2>
        </header>
        {summaryText && (
          <p
            id={summaryId}
            className="mt-2 text-sm leading-relaxed text-slate-700"
            style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {summaryText}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-600" aria-label={`${t('lastUpdated', lang)} ${updatedLabel}`}>
            {updatedLabel}
          </span>
          <span aria-hidden="true">•</span>
          <ConfidenceBadge value={evt.confidence ?? 0} />
          {evt.category && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{evt.category}</span>
          )}
        </div>
        {sources.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center -space-x-2">
              {sources.map((src) => (
                <span
                  key={src.sourceId}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white bg-slate-100 text-[10px] font-semibold text-slate-700"
                  aria-label={src.sourceName || 'Source'}
                >
                  {src.sourceLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src.sourceLogo}
                      alt={src.sourceName || ''}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (src.sourceName || '').slice(0, 2).toUpperCase() || '—'
                  )}
                </span>
              ))}
            </div>
            {remainingSources > 0 && (
              <span className="text-xs text-slate-600">+{remainingSources} more</span>
            )}
          </div>
        )}
        {evt.biasSummary && evt.biasSummary.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {evt.biasSummary.slice(0, 4).map((b) => (
              <BiasChip key={b.sourceId} score={b.score} />
            ))}
            {evt.biasSummary.length > 4 && (
              <span className="text-xs text-slate-600">+{evt.biasSummary.length - 4}</span>
            )}
          </div>
        )}
        <div className="mt-4 text-sm font-medium text-blue-600">{t('openEvent', lang)}</div>
      </article>
    </Link>
  );
}
