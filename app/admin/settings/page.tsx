"use client";
import * as React from 'react';

export default function AdminSettings() {
  const [enabled, setEnabled] = React.useState(true);
  const [feedFrequency, setFeedFrequency] = React.useState(5);
  const [eventInline, setEventInline] = React.useState(true);

  const apply = () => {
    try {
      document.cookie = `adsEnabled=${enabled ? 'true' : 'false'}; path=/`;
      document.cookie = `feedFrequency=${feedFrequency}; path=/`;
      document.cookie = `eventInline=${eventInline ? 'true' : 'false'}; path=/`;
      alert('Settings saved. Refresh the site to apply.');
    } catch {}
  };

  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-4">Site Settings</h1>
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Ad Management</h2>
        <div className="border rounded-xl p-3 text-sm">
          <label className="block mb-2">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="mr-2" />
            Enable ads
          </label>
          <label className="block mb-2">
            Insert ad after every
            <input type="number" min={1} value={feedFrequency} onChange={(e) => setFeedFrequency(Number(e.target.value))} className="border rounded px-2 py-1 text-sm mx-2 w-20" />
            items (Home feed)
          </label>
          <label className="block mb-2">
            <input type="checkbox" checked={eventInline} onChange={(e) => setEventInline(e.target.checked)} className="mr-2" />
            Show inline ad on Event page
          </label>
          <button className="mt-2 px-3 py-1 border rounded-lg text-sm" onClick={apply}>Save settings</button>
        </div>
        <p className="text-xs text-slate-600 mt-2">Note: These settings are cookie-based placeholders. Persist to DB for production.</p>
      </section>
    </main>
  );
}

