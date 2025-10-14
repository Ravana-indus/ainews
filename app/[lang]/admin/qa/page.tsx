"use client";
import * as React from 'react';

export default function AdminQA() {
  const [items, setItems] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('/api/admin/qa').then((r) => r.json()).then((data) => setItems(data.items || []));
  }, []);
  async function approve(id: string) {
    await fetch('/api/admin/qa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'approve' }) });
  }
  async function decline(id: string) {
    await fetch('/api/admin/qa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'decline' }) });
  }
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-3">Admin • QA Queue</h1>
      <ul>
        {items.map((e) => (
          <li key={e.id} className="border rounded-xl p-3 mb-2 text-sm">
            <div className="font-medium">{e.canonical_title}</div>
            <div className="text-xs text-slate-600">Updated {new Date(e.last_updated_at).toLocaleString()} • Avg conf {Math.round(e.avg_confidence)}% • Lean stddev {Number(e.lean_stddev).toFixed(2)}</div>
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-1 border rounded-lg" onClick={() => approve(e.id)}>Approve</button>
              <button className="px-3 py-1 border rounded-lg" onClick={() => decline(e.id)}>Decline</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

