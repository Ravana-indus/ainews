'use client';
import Link from 'next/link';
import BiasChip from './BiasChip';
import ConfidenceBadge from './ConfidenceBadge';
import { useLang } from './LanguageProvider';

type EventItem = any;

export default function EventCard({ evt }: { evt: EventItem }) {
  const { lang } = useLang();
  return (
    <Link href={`/${lang}/event/${evt.id}`} className="block rounded-2xl border p-4 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <h2 className="text-base font-semibold">{evt.title}</h2>
      <p className="mt-2 text-sm text-slate-700" aria-describedby={`evt-${evt.id}-summary`}>
        {evt.summary[lang]}
      </p>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Updated {new Date(evt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-2">
          {evt.category && <span className="px-2 py-1 text-xs bg-slate-100 rounded-full">{evt.category}</span>}
          <ConfidenceBadge value={evt.confidence} />
        </div>
      </div>

      {evt.sources && evt.sources.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            {evt.sources.slice(0, 4).map((s: any) => (
              <img key={s.sourceId} src={s.sourceLogo} alt={s.sourceName} className="inline-block h-6 w-6 rounded-full ring-2 ring-white" title={s.sourceName} />
            ))}
          </div>
          {evt.sources.length > 4 && (
            <span className="text-xs text-slate-600">+{evt.sources.length - 4} more</span>
          )}
        </div>
      )}

      {evt.biasSummary && evt.biasSummary.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {evt.biasSummary.map((b: any) => (
            <BiasChip key={b.sourceId} score={b.score} />
          ))}
        </div>
      )}

      <div className="mt-4 text-blue-600 text-sm font-semibold">Open event →</div>
    </Link>
  );
}
