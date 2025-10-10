"use client";
import * as React from 'react';

export default function AdminTranslations() {
  const [items, setItems] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('/api/admin/translations').then((r) => r.json()).then((data) => setItems(data.items || []));
  }, []);
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-3">Admin • Translations</h1>
      <ul>
        {items.map((x) => (
          <li key={x.event_id} className="border rounded-xl p-3 mb-2 text-sm">
            <div className="font-medium">{x.canonical_title}</div>
            <div className="grid gap-1 mt-2">
              <div><span className="text-xs">EN:</span> {x.en_summary || '—'}</div>
              <div><span className="text-xs">SI:</span> {x.si_summary || '—'}</div>
              <div><span className="text-xs">TA:</span> {x.ta_summary || '—'}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
