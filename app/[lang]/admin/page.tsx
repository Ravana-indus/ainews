"use client";
import * as React from 'react';
import { fetchKPI } from '../../lib/data';

const initial = { articles24h: 0, eventsCreated: 0, summariesGenerated: 0, failures: 0, avgConfidence: 0 };

export default function AdminDashboard() {
  const [kpi, setKpi] = React.useState(initial);
  React.useEffect(() => {
    fetchKPI().then((x) => setKpi(x));
  }, []);
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-3">Admin Dashboard</h1>
      {/* Quick Shortcuts */}
      <section className="mb-4">
        <div className="font-medium mb-2">Quick Shortcuts</div>
        <div className="flex gap-2 flex-wrap text-sm">
          <a href="/admin/sync" className="px-3 py-2 border rounded-lg">Pipeline Sync</a>
          <a href="/admin/ingest" className="px-3 py-2 border rounded-lg">News Ingestion</a>
          <a href="/admin/sources" className="px-3 py-2 border rounded-lg">Sources</a>
          <a href="/admin/events" className="px-3 py-2 border rounded-lg">Events</a>
          <a href="/admin/articles" className="px-3 py-2 border rounded-lg">Articles</a>
          <a href="/admin/logs" className="px-3 py-2 border rounded-lg">Logs</a>
          <a href="/admin/qa" className="px-3 py-2 border rounded-lg">QA Checks</a>
          <a href="/admin/settings" className="px-3 py-2 border rounded-lg">Site Settings</a>
          <a href="/admin/ads" className="px-3 py-2 border rounded-lg">Ad Slots</a>
          <a href="/admin/ai" className="px-3 py-2 border rounded-lg">AI Endpoints</a>
          <a href="/admin/translations" className="px-3 py-2 border rounded-lg">Translations</a>
          <a href="/admin/dashboard" className="px-3 py-2 border rounded-lg">Dashboard</a>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-xl p-3 text-sm">Articles (24h): {kpi.articles24h}</div>
        <div className="border rounded-xl p-3 text-sm">Events: {kpi.eventsCreated}</div>
        <div className="border rounded-xl p-3 text-sm">Summaries: {kpi.summariesGenerated}</div>
        <div className="border rounded-xl p-3 text-sm">Failures: {kpi.failures}</div>
        <div className="border rounded-xl p-3 text-sm">Avg Confidence: {kpi.avgConfidence}%</div>
      </div>
      <section className="mt-6">
        <h2 className="font-semibold mb-2">Settings</h2>
        <div className="flex gap-2 flex-wrap">
          <a href="/admin/dashboard" className="px-3 py-2 border rounded-lg text-sm">Dashboard</a>
          <a href="/admin/ingest" className="px-3 py-2 border rounded-lg text-sm bg-blue-50">📰 News Ingestion</a>
          <a href="/admin/settings" className="px-3 py-2 border rounded-lg text-sm">Site Settings</a>
          <a href="/admin/ads" className="px-3 py-2 border rounded-lg text-sm">Ad Slots</a>
          <a href="/admin/ai" className="px-3 py-2 border rounded-lg text-sm">AI Endpoints</a>
          <a href="/admin/sources" className="px-3 py-2 border rounded-lg text-sm">Sources</a>
          <a href="/admin/events" className="px-3 py-2 border rounded-lg text-sm">Events</a>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-semibold mb-2">Fetch & Seed Test Events</h2>
        <FetchSeedForm />
      </section>
    </main>
  );
}

function FetchSeedForm() {
  const [amount, setAmount] = React.useState(3);
  const [adminToken, setAdminToken] = React.useState('');
  const [result, setResult] = React.useState('');
  React.useEffect(() => {
    try {
      const t = localStorage.getItem('admin_token') || '';
      if (t) setAdminToken(t);
    } catch {}
  }, []);
  const run = async () => {
    setResult('');
    const res = await fetch('/api/admin/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
      body: JSON.stringify({ amount })
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  };
  return (
    <div className="border rounded-xl p-3 text-sm">
      <div className="grid sm:grid-cols-3 gap-2">
        <label className="block">Amount
          <input type="number" min={1} max={20} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="border rounded px-2 py-1 text-sm w-full" />
        </label>
        <label className="block">Admin Token
          <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
        </label>
        <div className="flex items-end"><button className="px-3 py-1 border rounded-lg" onClick={run}>Fetch</button></div>
      </div>
      <pre className="mt-2 border rounded-xl p-3 bg-slate-50 text-xs overflow-auto max-h-64">{result}</pre>
      <p className="text-xs text-slate-600 mt-1">Seeds events from latest articles for testing.</p>
    </div>
  );
}
