"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function AdminEventDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [evt, setEvt] = React.useState<any>(null);
  const [lang, setLang] = React.useState<'en'|'si'|'ta'>('en');
  const [summary, setSummary] = React.useState('');
  const [detail, setDetail] = React.useState('');
  React.useEffect(() => {
    fetch(`/api/events/${params.id}?lang=${lang}`).then((r) => r.json()).then((data) => {
      setEvt(data);
      setSummary(data.summary[lang] || '');
      setDetail(data.detail[lang] || '');
    });
  }, [params.id, lang]);
  async function save() {
    await fetch('/api/summaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: evt.id, lang, neutral_summary: summary, neutral_detail: detail }) });
    router.refresh();
  }
  if (!evt) return <main className="mx-auto max-w-screen-sm p-4">Loading…</main>;
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-3">Admin • Event</h1>
      <div className="text-sm mb-2">{evt.title}</div>
      <div className="flex gap-2 mb-3">
        <select className="border rounded-lg p-2 text-sm" value={lang} onChange={(e) => setLang(e.target.value as any)}>
          <option value="en">EN</option>
          <option value="si">සි</option>
          <option value="ta">த</option>
        </select>
        <button className="px-3 py-2 border rounded-lg text-sm" onClick={save}>Save</button>
      </div>
      <div className="grid gap-2">
        <textarea className="border rounded-lg p-2 text-sm" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Neutral summary" />
        <textarea className="border rounded-lg p-2 text-sm" rows={6} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Neutral detail" />
      </div>
      <h2 className="font-semibold mt-4 mb-2">Sources</h2>
      <ul>
        {evt.sources.map((s: any) => (
          <li key={s.sourceId} className="border rounded-xl p-3 mb-2 text-sm">
            <div className="font-medium">{s.headline}</div>
            <div className="text-xs text-slate-600">Lean: {s.lean} • {s.reason}</div>
            <a href={s.url} target="_blank" rel="noopener nofollow" className="text-blue-600">Open</a>
          </li>
        ))}
      </ul>
    </main>
  );
}

