"use client";
import * as React from 'react';

export default function AdminEvents() {
  const [adminToken, setAdminToken] = React.useState('');
  const [events, setEvents] = React.useState<any[]>([]);
  const [query, setQuery] = React.useState('');
  const [keepId, setKeepId] = React.useState('');
  const [dropId, setDropId] = React.useState('');
  const [log, setLog] = React.useState('');
  const [sim, setSim] = React.useState<string>('');
  const [titleThreshold, setTitleThreshold] = React.useState(0.84);
  const [vectorThreshold, setVectorThreshold] = React.useState(0.92);
  const [drops, setDrops] = React.useState<string>('');
  const [dryRun, setDryRun] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [applyLog, setApplyLog] = React.useState('');

  React.useEffect(() => {
    try { const t = localStorage.getItem('admin_token') || ''; if (t) setAdminToken(t); } catch {}
    refresh();
  }, []);

  async function refresh() {
    const res = await fetch('/api/admin/events/list', { headers: { 'x-admin-token': adminToken || '' } });
    const j = await res.json();
    if (j.ok) setEvents(j.events); else setEvents([]);
  }

  async function merge() {
    setLog('');
    if (!keepId || !dropId || keepId === dropId) { setLog('Select two different events'); return; }
    try {
      const res = await fetch('/api/admin/merge', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ keepId, dropId }) });
      const j = await res.json();
      setLog(JSON.stringify(j, null, 2));
      await refresh();
    } catch (e) {
      setLog(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function mergeBatch() {
    setLog('');
    if (!keepId || !drops) { setLog('Select keep and enter drop IDs (comma-separated)'); return; }
    const ids = drops.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      for (const d of ids) {
        if (d && d !== keepId) {
          await fetch('/api/admin/merge', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ keepId, dropId: d }) });
        }
      }
      setLog(`Merged ${ids.length} events into ${keepId}`);
      await refresh();
    } catch (e) {
      setLog(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function recompute() {
    setLog('');
    if (!keepId) { setLog('Select keep event'); return; }
    const res = await fetch('/api/admin/event/recompute', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ eventId: keepId }) });
    const j = await res.json();
    setLog(JSON.stringify(j, null, 2));
  }

  async function previewSimilarity() {
    setSim('');
    if (!keepId || !dropId || keepId === dropId) { setSim('Select two different events'); return; }
    const res = await fetch(`/api/admin/events/similarity?a=${encodeURIComponent(keepId)}&b=${encodeURIComponent(dropId)}`, { headers: { 'x-admin-token': adminToken || '' } });
    const j = await res.json();
    if (j.ok) setSim(`TitleSim: ${j.titleSim} • VectorSim: ${j.vectorSim ?? 'n/a'}`); else setSim(`Error: ${j.error || 'unknown'}`);
  }

  async function runVectorDedup() {
    setLog('');
    try {
      const res = await fetch('/api/admin/dedupe/vector', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ threshold: vectorThreshold, limit: 300, dryRun }) });
      const j = await res.json();
      setLog(JSON.stringify(j, null, 2));
      if (!dryRun) await refresh();
    } catch (e) {
      setLog(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function loadSuggestions() {
    setLog('');
    const res = await fetch(`/api/admin/events/suggestions?title=${encodeURIComponent(titleThreshold)}&vector=${encodeURIComponent(vectorThreshold)}&limit=300`, { headers: { 'x-admin-token': adminToken || '' } });
    const j = await res.json();
    if (j.ok) setSuggestions(j.suggestions || []);
    else setSuggestions([]);
  }

  async function applySuggestions() {
    setApplyLog('');
    try {
      const res = await fetch('/api/admin/events/apply', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ titleThreshold, vectorThreshold, limit: 300, dryRun, recompute: true }) });
      const j = await res.json();
      setApplyLog(JSON.stringify(j, null, 2));
      if (!dryRun) await refresh();
    } catch (e) {
      setApplyLog(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const filtered = events.filter((e) => !query || e.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="mx-auto max-w-screen-md p-4">
      <h1 className="text-lg font-semibold mb-3">Admin • Events</h1>
      <div className="border rounded-xl p-3 mb-3">
        <div className="font-medium mb-2">Manual Merge</div>
        <div className="grid md:grid-cols-3 gap-2 text-sm">
          <label className="block">Admin Token
            <input value={adminToken} onChange={(e) => { setAdminToken(e.target.value); try { localStorage.setItem('admin_token', e.target.value); } catch {} }} className="border rounded px-2 py-1 text-sm w-full" />
          </label>
          <label className="block">Keep Event
            <select value={keepId} onChange={(e) => setKeepId(e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
              <option value="">Select...</option>
              {filtered.map((e) => <option key={e.id} value={e.id}>{e.title.slice(0, 80)} ({e.coverage})</option>)}
            </select>
          </label>
          <label className="block">Drop Event
            <select value={dropId} onChange={(e) => setDropId(e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
              <option value="">Select...</option>
              {filtered.map((e) => <option key={e.id} value={e.id}>{e.title.slice(0, 80)} ({e.coverage})</option>)}
            </select>
          </label>
          <label className="block">Drop IDs (batch)
            <input value={drops} onChange={(e) => setDrops(e.target.value)} placeholder="id1,id2,id3" className="border rounded px-2 py-1 text-sm w-full" />
          </label>
          <label className="block">Vector Threshold
            <input type="number" step={0.01} min={0.5} max={0.99} value={vectorThreshold} onChange={(e) => setVectorThreshold(Number(e.target.value))} className="border rounded px-2 py-1 text-sm w-full" />
          </label>
          <label className="block">Dry Run
            <select value={dryRun ? 'true' : 'false'} onChange={(e) => setDryRun(e.target.value === 'true')} className="border rounded px-2 py-1 text-sm w-full">
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button onClick={previewSimilarity} className="px-3 py-1 border rounded-lg text-sm">Preview Similarity</button>
          <button onClick={merge} className="px-3 py-1 border rounded-lg text-sm">Merge</button>
          <button onClick={mergeBatch} className="px-3 py-1 border rounded-lg text-sm">Merge Batch</button>
          <button onClick={refresh} className="px-3 py-1 border rounded-lg text-sm">Refresh</button>
          <button onClick={recompute} className="px-3 py-1 border rounded-lg text-sm">Recompute Summary/Bias</button>
          <button onClick={runVectorDedup} className="px-3 py-1 border rounded-lg text-sm">Run Vector Dedup</button>
          {sim && <span className="text-xs text-slate-600">{sim}</span>}
        </div>
      </div>
      {log && (
        <div className="border rounded-xl p-3 bg-slate-50"><pre className="text-xs whitespace-pre-wrap max-h-96 overflow-auto">{log}</pre></div>
      )}
      <div className="border rounded-xl p-3 mt-3">
        <div className="font-medium mb-2">Recent Events</div>
        <div className="mb-2 text-sm"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events..." className="border rounded px-2 py-1 text-sm w-full" /></div>
        <ul className="text-sm space-y-1">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-center justify-between">
              <span className="truncate max-w-[70%]">{e.title}</span>
              <span className="text-slate-600">coverage: {e.coverage}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border rounded-xl p-3 mt-3">
        <div className="font-medium mb-2">Suggested Merges</div>
        <div className="flex items-center gap-2 mb-2">
          <button onClick={loadSuggestions} className="px-3 py-1 border rounded-lg text-sm">Load Suggestions</button>
          <span className="text-xs text-slate-600">Thresholds — Title: {titleThreshold}, Vector: {vectorThreshold}</span>
          <button onClick={applySuggestions} className="px-3 py-1 border rounded-lg text-sm">Apply Suggestions</button>
          <span className="text-xs text-slate-600">Dry Run: {String(dryRun)}</span>
        </div>
        <ul className="text-sm space-y-1">
          {suggestions.map((s) => (
            <li key={`${s.keepId}-${s.dropId}`} className="flex items-center justify-between">
              <span className="truncate max-w-[70%]">keep: {s.keepTitle} • drop: {s.dropTitle}</span>
              <span className="text-slate-600">titleSim: {s.titleSim} • vectorSim: {s.vectorSim ?? 'n/a'}</span>
            </li>
          ))}
        </ul>
        {applyLog && (
          <div className="border rounded-xl p-3 bg-slate-50 mt-2"><pre className="text-xs whitespace-pre-wrap max-h-96 overflow-auto">{applyLog}</pre></div>
        )}
      </div>
    </main>
  );
}
