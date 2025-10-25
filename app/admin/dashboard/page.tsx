"use client";
import * as React from 'react';
import { fetchKPI } from '../../../lib/data';

export default function AdminDashboard() {
  const [kpi, setKpi] = React.useState({
    articles24h: 0,
    eventsCreated: 0,
    summariesGenerated: 0,
    failures: 0,
    avgConfidence: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchKPI();
      setKpi(data);
    } catch (error) {
      console.error('Error loading KPI:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-screen-lg p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <a href="/admin" className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">
            Back to Admin
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="border rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white">
          <div className="text-3xl font-bold text-blue-600">{kpi.articles24h}</div>
          <div className="text-sm text-slate-600 mt-2">Stories (24h)</div>
          <div className="text-xs text-slate-500 mt-1">Published in last 24 hours</div>
        </div>

        <div className="border rounded-xl p-6 bg-gradient-to-br from-green-50 to-white">
          <div className="text-3xl font-bold text-green-600">{kpi.eventsCreated}</div>
          <div className="text-sm text-slate-600 mt-2">Total Stories</div>
          <div className="text-xs text-slate-500 mt-1">All stories in database</div>
        </div>

        <div className="border rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white">
          <div className="text-3xl font-bold text-purple-600">{kpi.summariesGenerated}</div>
          <div className="text-sm text-slate-600 mt-2">Summaries</div>
          <div className="text-xs text-slate-500 mt-1">Generated summaries</div>
        </div>

        <div className="border rounded-xl p-6 bg-gradient-to-br from-red-50 to-white">
          <div className="text-3xl font-bold text-red-600">{kpi.failures}</div>
          <div className="text-sm text-slate-600 mt-2">Failures</div>
          <div className="text-xs text-slate-500 mt-1">Processing errors</div>
        </div>

        <div className="border rounded-xl p-6 bg-gradient-to-br from-amber-50 to-white">
          <div className="text-3xl font-bold text-amber-600">{kpi.avgConfidence}%</div>
          <div className="text-sm text-slate-600 mt-2">Confidence</div>
          <div className="text-xs text-slate-500 mt-1">Average confidence score</div>
        </div>
      </div>

      {/* Activity Summary */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Activity Summary</h2>
        <div className="border rounded-xl p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-slate-600 mb-2">Recent Activity</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Stories added today</span>
                  <span className="font-semibold">{kpi.articles24h}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total database entries</span>
                  <span className="font-semibold">{kpi.eventsCreated}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success rate</span>
                  <span className="font-semibold text-green-600">
                    {kpi.eventsCreated > 0
                      ? Math.round(((kpi.eventsCreated - kpi.failures) / kpi.eventsCreated) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-600 mb-2">Quality Metrics</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average confidence</span>
                  <span className="font-semibold">{kpi.avgConfidence}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing status</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data source</span>
                  <span className="font-semibold">Supabase</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/events" className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div className="text-lg mb-1">📰</div>
            <div className="font-medium mb-1">View Stories</div>
            <div className="text-xs text-slate-600">Browse all stories in the database</div>
          </a>
          <a href="/admin/settings" className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div className="text-lg mb-1">⚙️</div>
            <div className="font-medium mb-1">Settings</div>
            <div className="text-xs text-slate-600">Configure site settings</div>
          </a>
          <a href="/" className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div className="text-lg mb-1">🌐</div>
            <div className="font-medium mb-1">View Site</div>
            <div className="text-xs text-slate-600">See the public-facing site</div>
          </a>
        </div>
      </section>
    </main>
  );
}
