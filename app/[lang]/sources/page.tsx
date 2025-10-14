"use client";
import * as React from 'react';
import { fetchSources } from '../../lib/data';

const SourcesList = () => {
  const [sources, setSources] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetchSources().then((rows) => setSources(rows));
  }, []);
  return (
    <ul>
      {sources.map((s) => (
        <li key={s.id} className="border rounded-xl p-3 mb-2">
          <div className="text-sm font-medium">{s.name} <span className="text-slate-500">({s.domain})</span></div>
          <div className="text-xs text-slate-600">Lang: {s.language} • Reliability: {Math.round((s.reliability || 0) * 100)}%</div>
        </li>
      ))}
    </ul>
  );
};

export default function SourcesPage() {
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-3">Sources</h1>
      <SourcesList />
    </main>
  );
}
