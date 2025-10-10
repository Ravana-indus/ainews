"use client";
import * as React from 'react';

type AdUnit = { id: string; position: 'inline' | 'sidebar' | 'footer'; label: string; enabled: boolean };
const initialUnits: AdUnit[] = [
  { id: 'ad_inline_1', position: 'inline', label: 'Inline Slot 1', enabled: true },
  { id: 'ad_sidebar_1', position: 'sidebar', label: 'Sidebar Slot 1', enabled: false },
  { id: 'ad_footer', position: 'footer', label: 'Footer Slot', enabled: true },
];

export default function AdminAds() {
  const [units, setUnits] = React.useState<AdUnit[]>(initialUnits);
  const toggle = (id: string) => setUnits((u) => u.map((x) => x.id === id ? { ...x, enabled: !x.enabled } : x));
  const rename = (id: string, label: string) => setUnits((u) => u.map((x) => x.id === id ? { ...x, label } : x));
  const add = () => setUnits((u) => [...u, { id: `ad_${Date.now()}`, position: 'inline', label: 'New Slot', enabled: false }]);
  const remove = (id: string) => setUnits((u) => u.filter((x) => x.id !== id));
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-4">Ad Management</h1>
      <button className="mb-3 px-3 py-1 border rounded-lg text-sm" onClick={add}>Add slot</button>
      <ul>
        {units.map((u) => (
          <li key={u.id} className="border rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{u.label} <span className="text-xs text-slate-500">({u.position})</span></div>
              <div className="flex items-center gap-2">
                <label className="text-xs">
                  <input type="checkbox" checked={u.enabled} onChange={() => toggle(u.id)} className="mr-1" /> Enabled
                </label>
                <button className="text-sm text-red-600" onClick={() => remove(u.id)}>Delete</button>
              </div>
            </div>
            <div className="mt-2">
              <input value={u.label} onChange={(e) => rename(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm w-full" aria-label="Slot label" />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-600 mt-2">Note: These settings are local-only placeholders. Hook up to your CMS or database to persist.</p>
    </main>
  );
}

