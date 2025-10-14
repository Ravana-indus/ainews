"use client";
import * as React from 'react';

export default function AdminLogs() {
  const [runs, setRuns] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then((data) => setRuns(data.runs || []));
  }, []);
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-3">Admin • Logs</h1>
      <ul>
        {runs.map((r) => (
          <li key={r.id} className="border rounded-xl p-3 mb-2 text-sm">
            <div>Started: {new Date(r.started_at).toLocaleString()}</div>
            <div>Finished: {r.finished_at ? new Date(r.finished_at).toLocaleString() : '-'}</div>
            <div>Status: {r.status}</div>
            {r.error_message && <div className="text-red-700">Error: {r.error_message}</div>}
          </li>
        ))}
      </ul>
    </main>
  );
}
