"use client";
import * as React from 'react';

export default function FetchAllButton({ adminToken, amount }: { adminToken: string; amount: number }) {
  const [running, setRunning] = React.useState(false);
  const [logs, setLogs] = React.useState<string>('');
  const [results, setResults] = React.useState<Record<string, { created: number; errors: number }>>({});

  async function run() {
    if (!adminToken) return;
    setRunning(true);
    setLogs('');
    setResults({});
    try {
      const res = await fetch('/api/admin/sources');
      const json = await res.json();
      const sources = (json.sources || []).filter((s: any) => s.enabled);
      for (const s of sources) {
        setLogs((l) => l + `\n=== ${s.name} (${s.domain}) ===`);
        const r = await fetch('/api/admin/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify({ amount, sourceId: s.id }),
        });
        const jr = await r.json();
        setResults((prev) => ({ ...prev, [s.id]: { created: (jr.created || []).length, errors: (jr.errors || []).length } }));
        setLogs((l) => l + `\nCreated: ${(jr.created || []).length}; Errors: ${(jr.errors || []).length}`);
      }
    } catch (err) {
      setLogs((l) => l + `\nError: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-4">
      <button onClick={run} disabled={!adminToken || running} className="px-4 py-2 border rounded-lg text-sm hover:bg-blue-50">
        {running ? 'Fetching all sources...' : 'Fetch All Sources'}
      </button>
      {Object.keys(results).length > 0 && (
        <div className="mt-2 text-xs">
          {Object.entries(results).map(([id, r]) => (
            <div key={id}>Source {id}: created {r.created}, errors {r.errors}</div>
          ))}
        </div>
      )}
      {logs && (
        <pre className="mt-2 text-xs whitespace-pre-wrap bg-slate-50 p-2 rounded max-h-64 overflow-auto">{logs}</pre>
      )}
    </div>
  );
}

