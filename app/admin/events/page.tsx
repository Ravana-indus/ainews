"use client";
import * as React from 'react';
import Link from 'next/link';

export default function AdminEvents() {
  const [items, setItems] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('/api/events').then((r) => r.json()).then((data) => setItems(data.events || []));
  }, []);
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-3">Admin • Events</h1>
      <ul>
        {items.map((e) => (
          <li key={e.id} className="border rounded-xl p-3 mb-2 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{e.title}</div>
              <div className="text-xs text-slate-600">Updated {new Date(e.updatedAt).toLocaleString()} • {e.category} • {e.confidence}%</div>
            </div>
            <Link className="px-2 py-1 border rounded-lg" href={`/admin/events/${e.id}`}>Open</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
