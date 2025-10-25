import Link from 'next/link';
import BiasChip from './BiasChip';
type EventItem = any;

export default function EventCard({ evt, lang = 'en' }: { evt: EventItem; lang?: 'en'|'si'|'ta' }) {
  return (
    <Link
      href={`/event/${evt.id}`}
      className="block rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 hover:shadow-md dark:hover:shadow-slate-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{evt.title}</h2>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300" aria-describedby={`evt-${evt.id}-summary`}>
        {evt.summary[lang]}
      </p>
      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Updated {new Date(evt.updatedAt).toLocaleString()} • Confidence {evt.confidence}%
      </div>
      {evt.category && (
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 dark:text-slate-200 rounded-full">{evt.category}</span>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        {evt.biasSummary && evt.biasSummary.slice(0, 4).map((b: any) => (
          <BiasChip key={b.sourceId} score={b.score} />
        ))}
        {evt.biasSummary && evt.biasSummary.length > 4 && (
          <span className="text-xs text-slate-600 dark:text-slate-400">+{evt.biasSummary.length - 4} more</span>
        )}
      </div>
      <div className="mt-3 text-blue-600 dark:text-blue-400 text-sm">Open event →</div>
    </Link>
  );
}
