"use client";
import * as React from 'react';
import { fetchKPI } from '../../lib/data';

const initial = { articles24h: 0, eventsCreated: 0, summariesGenerated: 0, failures: 0, avgConfidence: 0 };

export default function AdminDashboard() {
  const [kpi, setKpi] = React.useState(initial);
  const [syncing, setSyncing] = React.useState(false);
  const [duplicatesRemoved, setDuplicatesRemoved] = React.useState(0);

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    fetchKPI().then((x) => {
      setKpi(x);
      setDuplicatesRemoved(x.duplicatesRemoved || 0);
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/sync');
      if (res.ok) {
        alert('Sync completed successfully');
        loadStats(); // Reload stats after sync
      } else {
        alert('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="mx-auto max-w-screen-lg p-4 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold dark:text-white">Admin Dashboard</h1>
        <a href="/" className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white transition-colors">
          View Site
        </a>
      </div>

      {/* Stats Overview */}
      <section className="mb-6">
        <div className="font-medium mb-3 text-slate-600 dark:text-slate-400">Stories Overview</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
            <div className="text-2xl font-semibold dark:text-white">{kpi.articles24h}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Stories (24h)</div>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
            <div className="text-2xl font-semibold dark:text-white">{kpi.eventsCreated}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Unique Stories</div>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
            <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">{duplicatesRemoved}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Duplicates Removed</div>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
            <div className="text-2xl font-semibold dark:text-white">{kpi.summariesGenerated}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Summaries</div>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
            <div className="text-2xl font-semibold dark:text-white">{kpi.avgConfidence}%</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Avg Confidence</div>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
            <div className="text-2xl font-semibold dark:text-white">{kpi.failures}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Failures</div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-6">
        <div className="font-medium mb-3 text-slate-600 dark:text-slate-400">Quick Actions</div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-sm transition-colors"
          >
            {syncing ? 'Syncing...' : 'Refresh Data'}
          </button>
          <button
            onClick={loadStats}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white text-sm transition-colors"
          >
            Reload Stats
          </button>
        </div>
      </section>

      {/* Management Links */}
      <section className="mb-6">
        <div className="font-medium mb-3 text-slate-600 dark:text-slate-400">Management</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <a href="/admin/dashboard" className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="font-medium mb-1 dark:text-white">Dashboard</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">View detailed analytics</div>
          </a>
          <a href="/admin/events" className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="font-medium mb-1 dark:text-white">Stories</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Browse all stories</div>
          </a>
          <a href="/admin/settings" className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="font-medium mb-1 dark:text-white">Settings</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Site configuration</div>
          </a>
        </div>
      </section>

      {/* Data Source Info */}
      <section className="mb-6">
        <div className="font-medium mb-3 text-slate-600 dark:text-slate-400">Data Source</div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
          <div className="text-sm mb-2 dark:text-slate-200">
            <span className="font-medium">Source:</span> Supabase (stories table)
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            All content is fetched from the stories table in your Supabase database.
            Stories are displayed with their title, content, category, and source information.
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section>
        <div className="font-medium mb-3 text-slate-600 dark:text-slate-400">Help</div>
        <div className="border border-blue-200 dark:border-blue-900 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30 text-sm">
          <div className="font-medium mb-2 dark:text-blue-300">Quick Tips:</div>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
            <li>Stories are automatically fetched from Supabase</li>
            <li>Click "Refresh Data" to reload stories from the database</li>
            <li>Stories are filtered for duplicates based on URL and title similarity</li>
            <li>Each story includes title, content, category, and sources</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
