import Link from 'next/link';
import BiasChip from './BiasChip';
type EventItem = any;

export default function EventCard({ evt, lang = 'en' }: { evt: EventItem; lang?: 'en'|'si'|'ta' }) {
  return (
    <Link href={`/event/${evt.id}`} className="block rounded-2xl border p-4 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <h2 className="text-base font-semibold">{evt.title}</h2>
      <p className="mt-2 text-sm text-slate-700" aria-describedby={`evt-${evt.id}-summary`}>
        {evt.summary[lang]}
      </p>
      <div className="mt-3 text-xs text-slate-500">
        Updated {new Date(evt.updatedAt).toLocaleString()} • Confidence {evt.confidence}%
      </div>
      {evt.category && (
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="px-2 py-1 text-xs bg-slate-100 rounded-full">{evt.category}</span>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        {evt.biasSummary && evt.biasSummary.slice(0, 4).map((b: any) => (
          <BiasChip key={b.sourceId} score={b.score} />
        ))}
        {evt.biasSummary && evt.biasSummary.length > 4 && (
          <span className="text-xs text-slate-600">+{evt.biasSummary.length - 4} more</span>
        )}
      </div>
      <div className="mt-3 text-blue-600 text-sm">Open event →</div>
    </Link>
  );
}
