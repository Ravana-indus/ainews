"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchEvents } from '../../lib/data';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [lang, setLang] = useState<'en'|'si'|'ta'>('en');
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetchEvents(lang).then((rows) => setItems(rows));
  }, [lang]);
  const filtered = items.filter((e) => e.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <header className="flex items-center justify-between mb-4">
        <div className="font-semibold">Search</div>
        <Link href="/" className="text-blue-600 text-sm">Home</Link>
      </header>
      <input
        type="search"
        placeholder="Search events"
        className="w-full border rounded-lg p-2 mb-4"
        aria-label="Search events"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="flex gap-2 mb-3">
        <select className="border rounded-lg p-2 text-sm" value={lang} onChange={(e) => setLang(e.target.value as any)} aria-label="Language filter">
          <option value="en">English</option>
          <option value="si">Sinhala</option>
          <option value="ta">Tamil</option>
        </select>
        <select className="border rounded-lg p-2 text-sm" aria-label="Category filter">
          <option>All Categories</option>
          <option>Economy</option>
          <option>Education</option>
        </select>
        <input type="range" min={0} max={100} defaultValue={50} aria-label="Confidence filter" />
      </div>
      <div className="text-sm text-slate-600 mb-2">Results</div>
      <ul>
        {filtered.map((evt) => (
          <li key={evt.id} className="mb-3">
            <Link href={`/event/${evt.id}`} className="block border rounded-xl p-3">
              <div className="font-medium text-sm">{evt.title}</div>
              <div className="text-xs text-slate-600">{evt.category} • {evt.confidence}%</div>
              <div className="mt-1 text-sm text-slate-700">{evt.summary[lang]}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
