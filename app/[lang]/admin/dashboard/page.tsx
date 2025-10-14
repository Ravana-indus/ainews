"use client";
import * as React from 'react';
import { fetchKPI } from '../../../lib/data';
import Chart from '../../../components/Chart';

export default function AdminDashboard() {
  const [kpi, setKpi] = React.useState({ articles24h: 0, eventsCreated: 0, summariesGenerated: 0, failures: 0, avgConfidence: 0 });
  const [syncLoading, setSyncLoading] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<string>('');
  const [adminToken, setAdminToken] = React.useState('');

  React.useEffect(() => {
    fetchKPI().then(setKpi);
    try {
      const token = localStorage.getItem('admin_token') || '';
      setAdminToken(token);
    } catch {}
  }, []);

  async function handleQuickSync() {
    if (!adminToken) {
      setSyncStatus('Admin token required for sync');
      return;
    }

    setSyncLoading(true);
    setSyncStatus('');

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus(`✅ Sync completed in ${data.summary.duration}!
Events: ${data.summary.eventsCreated} | Summaries: ${data.summary.summariesGenerated}`);
        // Refresh KPI
        setTimeout(() => fetchKPI().then(setKpi), 2000);
      } else {
        setSyncStatus(`❌ ${data.error}`);
      }
    } catch (error) {
      setSyncStatus('❌ Sync failed');
    } finally {
      setSyncLoading(false);
      setTimeout(() => setSyncStatus(''), 5000);
    }
  }
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        <button
          onClick={handleQuickSync}
          disabled={syncLoading || !adminToken}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            syncLoading || !adminToken
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {syncLoading ? 'Syncing...' : '🔄 Sync Now'}
        </button>
      </div>

      {syncStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          syncStatus.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {syncStatus}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-xl p-3 text-sm">Articles (24h): {kpi.articles24h}</div>
        <div className="border rounded-xl p-3 text-sm">Events: {kpi.eventsCreated}</div>
        <div className="border rounded-xl p-3 text-sm">Summaries: {kpi.summariesGenerated}</div>
        <div className="border rounded-xl p-3 text-sm">Failures: {kpi.failures}</div>
        <div className="border rounded-xl p-3 text-sm">Avg Confidence: {kpi.avgConfidence}%</div>
      </div>
      <section className="mt-6">
        <h2 className="font-semibold mb-2">Confidence Trend</h2>
        <Chart data={[
          { time: '08:00', value: kpi.avgConfidence - 2 },
          { time: '09:00', value: kpi.avgConfidence - 1 },
          { time: '10:00', value: kpi.avgConfidence },
          { time: '11:00', value: kpi.avgConfidence + 1 },
        ]} />
      </section>
      <section className="mt-6">
        <h2 className="font-semibold mb-2">Quick Links</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li><a className="text-blue-600" href="/admin/sync">🔄 Pipeline Sync</a> - Manual AI pipeline control</li>
          <li><a className="text-blue-600" href="/admin/settings">⚙️ Site Settings</a></li>
          <li><a className="text-blue-600" href="/admin/ads">📊 Ad Slots</a></li>
          <li><a className="text-blue-600" href="/admin/events">📰 Events</a></li>
          <li><a className="text-blue-600" href="/admin/sources">🔗 Sources</a></li>
          <li><a className="text-blue-600" href="/admin/ingest">📡 Ingest News</a></li>
        </ul>
      </section>
    </main>
  );
}
