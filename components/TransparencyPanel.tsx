"use client";
import { useState } from 'react';

export default function TransparencyPanel({ sources }: { sources: { url: string; headline: string; lean: number; reason: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-6">
      <button className="px-3 py-2 border rounded-lg text-sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>How AI Decided</button>
      {open && (
        <div className="mt-2 border rounded-xl p-3 text-sm">
          <div className="mb-2 text-slate-700">Sources used and lean reasoning:</div>
          <ul>
            {sources.map((s, i) => (
              <li key={i} className="mb-2">
                <div className="font-medium">{s.headline}</div>
                <div className="text-xs text-slate-600">Lean: {s.lean} • {s.reason}</div>
                <a href={s.url} target="_blank" rel="noopener nofollow" className="text-blue-600">Open source</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

