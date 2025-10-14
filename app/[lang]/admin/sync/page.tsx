"use client";
import * as React from 'react';
import FetchAllButton from '@/components/FetchAllButton';
import NeutralityGauge from '@/components/NeutralityGauge';
import BiasBars from '@/components/BiasBars';
import BiasRadar from '@/components/BiasRadar';

export default function AdminSync() {
  const [adminToken, setAdminToken] = React.useState('');
  const [syncLoading, setSyncLoading] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<string>('');
  const [pipelineStatus, setPipelineStatus] = React.useState<any>(null);
  const [statusLoading, setStatusLoading] = React.useState(true);
  const [sources, setSources] = React.useState<any[]>([]);
  const [sourcesLoading, setSourcesLoading] = React.useState(true);
  const [perSourceAmount, setPerSourceAmount] = React.useState<number>(10);
  const [fetchingSourceId, setFetchingSourceId] = React.useState<string | null>(null);
  const [fetchResult, setFetchResult] = React.useState<string>('');
  const [verifyLoading, setVerifyLoading] = React.useState(false);
  const [verifyData, setVerifyData] = React.useState<any[] | null>(null);
  const [verifyGroups, setVerifyGroups] = React.useState<Record<string, string[]> | null>(null);

  // Load admin token and pipeline status on mount
  React.useEffect(() => {
    let token = '';
    try {
      token = localStorage.getItem('admin_token') || '';
      setAdminToken(token);
    } catch {}
    fetchPipelineStatus(token);
    fetchSources();
  }, []);

  // Auto-refresh pipeline status every 30 seconds (uses latest token)
  React.useEffect(() => {
    if (!adminToken) return;
    const interval = setInterval(() => {
      fetchPipelineStatus(adminToken);
    }, 30000);
    return () => clearInterval(interval);
  }, [adminToken]);

  async function fetchPipelineStatus(tokenOverride?: string) {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenOverride ?? adminToken}`,
          'x-admin-token': tokenOverride ?? adminToken,
          'Content-Type': 'application/json',
        },
      });

      const ct = response.headers.get('content-type') || '';
      if (response.ok && ct.includes('application/json')) {
        const data = await response.json();
        setPipelineStatus(data);
      } else {
        const text = await response.text();
        setSyncStatus(`Failed status fetch (${response.status}): ${text.slice(0, 200)}`);
      }
    } catch (error) {
      console.error('Failed to fetch pipeline status:', error);
      setSyncStatus('Error fetching pipeline status');
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleManualSync() {
    if (!adminToken) {
      setSyncStatus('Please enter admin token');
      return;
    }

    setSyncLoading(true);
    setSyncStatus('');

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: perSourceAmount })
      });

      const ct = response.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await response.json() : { success: false, error: `HTTP ${response.status}` };

      if (data.success) {
        const details: Array<{ sourceId: string; sourceName: string; created: number; errors: string[] }> = data.summary?.ingestion?.details || [];
        const detailLines = details.slice(0, 10).map((d) => `   - ${d.sourceName}: +${d.created}${d.errors?.length ? ` • errors: ${d.errors.length}` : ''}`).join('\n');
        setSyncStatus(`✅ Sync completed!
📊 Results:
• Ingestion — sources attempted: ${data.summary?.ingestion?.sourcesAttempted ?? 0}
• Ingestion — events created: ${data.summary?.ingestion?.eventsCreated ?? 0}
• Ingestion — errors: ${data.summary?.ingestion?.errors ?? 0}
• Ingestion — amount per source: ${data.summary?.ingestion?.amountPerSource ?? perSourceAmount}
${details.length ? ` • Ingestion — per-source:\n${detailLines}` : ''}
• Articles embedded: ${data.summary.articlesEmbedded}
• Events created: ${data.summary.eventsCreated}
• Summaries generated: ${data.summary.summariesGenerated}
• Articles analyzed for bias: ${data.summary.biasAnalyzed}
• Categories assigned: ${data.summary.classified}
• Non-news flagged: ${data.summary.nonNewsFlagged}
• Dedup (title) merged: ${data.summary.dedupMergedTitle}
• Dedup (vector) merged: ${data.summary.dedupMergedVector}
• Duration: ${data.summary.duration}
• Completed: ${data.timestamp}`);

        // Refresh pipeline status
        await fetchPipelineStatus();
      } else {
        setSyncStatus(`❌ Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('❌ Sync failed: Network error');
    } finally {
      setSyncLoading(false);
    }
  }

  async function fetchSources() {
    setSourcesLoading(true);
    try {
      const res = await fetch('/api/admin/sources');
      const json = await res.json();
      setSources(json.sources || []);
    } catch (err) {
      setSyncStatus('Failed to load sources');
    } finally {
      setSourcesLoading(false);
    }
  }

  async function fetchForSource(sourceId: string) {
    if (!adminToken) {
      setSyncStatus('Please enter admin token');
      return;
    }
    setFetchingSourceId(sourceId);
    setFetchResult('');
    try {
      const res = await fetch('/api/admin/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ amount: perSourceAmount, sourceId })
      });
      const json = await res.json();
      setFetchResult(JSON.stringify(json, null, 2));
      if (json.ok) {
        setSyncStatus(`✅ Fetched ${json.created?.length || 0} events from selected source`);
      } else {
        setSyncStatus(`❌ Fetch failed: ${json.errors?.join('; ') || 'Unknown error'}`);
      }
      await fetchPipelineStatus();
    } catch (err) {
      setSyncStatus('❌ Fetch failed: Network error');
    } finally {
      setFetchingSourceId(null);
    }
  }

  async function handleVerify() {
    if (!adminToken) {
      setSyncStatus('Please enter admin token');
      return;
    }
    setVerifyLoading(true);
    setVerifyData(null);
    try {
      const res = await fetch('/api/admin/verify?limit=200', { headers: { 'x-admin-token': adminToken } });
      const json = await res.json();
      if (json.ok) {
        setVerifyData(json.events);
        setVerifyGroups(json.groups || null);
      } else {
        setSyncStatus('Verification failed');
      }
    } catch {
      setSyncStatus('Verification request failed');
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-screen-md p-4">
      <h1 className="text-lg font-semibold mb-4">Admin • AI Pipeline Sync</h1>

      {/* Admin Token */}
      <div className="border rounded-xl p-3 mb-4 text-sm">
        <div className="font-medium mb-2">Admin Token</div>
        <input
          className="border rounded-lg p-2 text-sm w-full"
          placeholder="Admin Token"
          value={adminToken}
          onChange={(e) => {
            const v = e.target.value;
            setAdminToken(v);
            try { localStorage.setItem('admin_token', v); } catch {}
          }}
          type="password"
        />
      </div>

      {/* Pipeline Status */}
      <div className="border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Pipeline Status</h2>
          <button
            onClick={() => fetchPipelineStatus()}
            className="px-3 py-1 border rounded-lg text-sm hover:bg-slate-50"
            disabled={statusLoading}
          >
            {statusLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {statusLoading ? (
          <div className="text-sm text-slate-600">Loading pipeline status...</div>
        ) : pipelineStatus ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${pipelineStatus.isRunning ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span>{pipelineStatus.isRunning ? 'Running' : 'Idle'}</span>
              {pipelineStatus.runningSince && (
                <span className="text-slate-500">
                  (Since: {new Date(pipelineStatus.runningSince).toLocaleString()})
                </span>
              )}
            </div>

            {pipelineStatus.stats && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Total Runs: {pipelineStatus.stats.totalRuns}</div>
                <div>Success Rate: {pipelineStatus.stats.totalRuns > 0
                  ? Math.round((pipelineStatus.stats.successfulRuns / pipelineStatus.stats.totalRuns) * 100)
                  : 0}%</div>
                <div>Avg Duration: {pipelineStatus.stats.avgDuration}</div>
                <div>Total Events: {pipelineStatus.stats.totalEventsCreated}</div>
                <div>Total Summaries: {pipelineStatus.stats.totalSummariesGenerated}</div>
                <div>Total Articles Embedded: {pipelineStatus.stats.totalArticlesEmbedded}</div>
              </div>
            )}

            {pipelineStatus.recentRuns && pipelineStatus.recentRuns.length > 0 && (
              <div>
                <div className="font-medium mb-1">Recent Runs:</div>
                <div className="space-y-1 text-xs">
                  {pipelineStatus.recentRuns.slice(0, 10).map((run: any, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        run.status === 'completed' ? 'bg-green-100 text-green-700' :
                        run.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {run.status}
                      </span>
                      <span className="text-slate-500">
                        {new Date(run.started_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-600">No pipeline status available</div>
        )}
      </div>

      {/* Manual Sync Button */}
      <div className="border rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3">Manual Sync</h2>
        <p className="text-sm text-slate-600 mb-3">
          Manually trigger the complete AI pipeline to process new articles,
          create events, generate summaries, and detect bias.
        </p>

        <button
          onClick={handleManualSync}
          disabled={syncLoading || !adminToken || pipelineStatus?.isRunning}
          className={`px-6 py-3 rounded-lg font-medium text-sm transition-colors ${
            syncLoading || !adminToken || pipelineStatus?.isRunning
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {syncLoading ? 'Syncing...' :
           pipelineStatus?.isRunning ? 'Pipeline Running...' :
           '🔄 Run Complete Pipeline Now'}
        </button>

        {pipelineStatus?.isRunning && (
          <p className="mt-2 text-xs text-slate-500">
            A pipeline is currently running. Please wait for it to complete before starting another.
          </p>
        )}
      </div>

      {/* Sync Status/Results */}
      {syncStatus && (
        <div className="border rounded-xl p-4 bg-slate-50">
          <h3 className="font-semibold mb-2">Status</h3>
          <pre className="text-xs whitespace-pre-wrap">{syncStatus}</pre>
        </div>
      )}

      {/* Pipeline Info */}
      <div className="border rounded-xl p-4 mt-4">
        <h3 className="font-semibold mb-2">What the Pipeline Does</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Embeds new articles with AI vectors</li>
          <li>Clusters similar articles into events</li>
          <li>Generates neutral summaries (EN/SI/TA)</li>
          <li>Detects media bias (-2 to +2 scale)</li>
          <li>Updates database and frontend</li>
        </ol>
        <p className="text-xs text-slate-600 mt-2">
          This usually takes 2-5 minutes depending on the number of articles.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="border rounded-xl p-4 mt-4">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={async () => {
              try {
                setSyncStatus('Adding sample news sources...');
                const res = await fetch('/api/admin/sources/test-data', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${adminToken}` }
                });
                const data = await res.json();
                if (data.success) {
                  setSyncStatus(`✅ ${data.message}\nAdded ${data.results.added} sources!`);
                  await fetchPipelineStatus();
                } else {
                  setSyncStatus(`❌ Failed to add sources: ${data.error}`);
                }
              } catch (error) {
                setSyncStatus('❌ Failed to add sample sources');
              }
              setTimeout(() => setSyncStatus(''), 5000);
            }}
            disabled={!adminToken || syncLoading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            📰 Add Sample News Sources
          </button>

          <button
            onClick={() => window.open('/admin/ingest', '_blank')}
            className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
          >
            📡 Fetch News Articles
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          First add sources, then fetch articles, then run the pipeline to process them.
        </p>
      </div>

      {/* Sources & Per-Source Fetch */}
      <div className="border rounded-xl p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Sources</h3>
          <button
            onClick={fetchSources}
            className="px-3 py-1 border rounded-lg text-sm hover:bg-slate-50"
            disabled={sourcesLoading}
          >
            {sourcesLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="mb-3">
          <label className="text-sm">Articles per source</label>
          <input
            type="number"
            min={1}
            max={20}
            value={perSourceAmount}
            onChange={(e) => setPerSourceAmount(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm w-28 ml-2"
          />
        </div>
        {sourcesLoading ? (
          <div className="text-sm text-slate-600">Loading sources...</div>
        ) : sources.length ? (
          <ul className="divide-y">
            {sources.map((s) => (
              <li key={s.id} className="py-2 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{s.name} <span className="text-slate-500">({s.domain})</span></div>
                  <div className="text-slate-600 text-xs">Lang: {s.language || 'n/a'} • RSS: {s.rss_url ? 'configured' : 'missing'} • Enabled: {s.enabled ? 'yes' : 'no'}</div>
                </div>
                <button
                  onClick={() => fetchForSource(s.id)}
                  disabled={!adminToken || fetchingSourceId === s.id || !s.enabled}
                  className={`px-3 py-1 rounded-lg text-sm border ${(!adminToken || !s.enabled) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 border-blue-600 text-blue-600'}`}
                >
                  {fetchingSourceId === s.id ? 'Fetching...' : (s.rss_url ? 'Fetch from this source' : 'Scrape latest from domain')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-600">No sources available. Use “Add Sample News Sources” above.</div>
        )}
        {/* Fetch All */}
        <FetchAllButton adminToken={adminToken} amount={perSourceAmount} />
      </div>

      {/* Per-Source Fetch Result */}
      {fetchResult && (
        <div className="border rounded-xl p-4 bg-slate-50 mt-4">
          <h3 className="font-semibold mb-2">Fetch Result</h3>
          <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">{fetchResult}</pre>
        </div>
      )}

      {/* Cross-Verification */}
      <div className="border rounded-xl p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Cross-Verify Latest Events</h3>
          <button
            onClick={handleVerify}
            disabled={verifyLoading || !adminToken}
            className={`px-3 py-1 rounded-lg text-sm border ${(!adminToken) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
          >
            {verifyLoading ? 'Analyzing...' : 'Analyze Neutrality & Bias'}
          </button>
        </div>
        <div className="flex gap-2 mb-2">
          <button
            className="px-3 py-1 text-xs border rounded-lg"
            disabled={!adminToken || verifyLoading}
            onClick={async () => {
              // Manual: classify categories/newsworthiness on demand
              try {
                const res = await fetch('/api/admin/classify', { method: 'POST', headers: { 'x-admin-token': adminToken } });
                const js = await res.json();
                if (js.ok) setSyncStatus(`Classified ${js.eventsProcessed} events; assigned ${js.categoriesAssigned}; non-news ${js.nonNewsFlagged}`);
                else setSyncStatus('Classification failed');
              } catch { setSyncStatus('Failed to trigger classification'); }
            }}
          >
            Run Classification Now
          </button>
          <button
            className="px-3 py-1 text-xs border rounded-lg"
            disabled={!adminToken || verifyLoading}
            onClick={async () => {
              // Manual: mark single-source events as non-news (heuristic)
              try {
                const r = await fetch('/api/admin/verify?limit=500', { headers: { 'x-admin-token': adminToken } });
                const j = await r.json();
                const ids = (j.events || []).filter((e: any) => (e.coverage || []).length < 2).map((e: any) => e.id);
                const res = await fetch('/api/admin/nonnews', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ ids }) });
                const js = await res.json();
                setSyncStatus(`Flagged ${js.flagged || 0} events as non-news`);
              } catch { setSyncStatus('Failed to flag non-news'); }
            }}
          >
            Flag Non‑News (Heuristic)
          </button>
          <button
            className="px-3 py-1 text-xs border rounded-lg"
            disabled={!adminToken || verifyLoading}
            onClick={async () => {
              // Manual: deduplicate recent events
              try {
                const res = await fetch('/api/admin/dedupe/full', { method: 'POST', headers: { 'x-admin-token': adminToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ threshold: 0.84, limit: 1000, maxIterations: 10, dryRun: false }) });
                const js = await res.json();
                const lines = (js.details || []).slice(0, 10).map((d: any) => `   - keep: ${d.keepTitle} / drop: ${d.dropTitle} (sim ${d.similarity})`).join('\n');
                setSyncStatus(`✅ Deduped ${js.merged} duplicates\n${lines}`);
              } catch { setSyncStatus('Failed to deduplicate'); }
            }}
          >
            Run Deduplication Now
          </button>
        </div>
        {!verifyData ? (
          <p className="text-sm text-slate-600">Runs a quick neutrality analysis and bias tally on the latest events.</p>
        ) : (
          <div className="space-y-3">
            {verifyData.map((e) => (
              <div key={e.id} className="border rounded-lg p-3">
                <div className="text-sm font-medium">{e.title}</div>
                <div className="text-xs text-slate-600">Updated: {new Date(e.updatedAt).toLocaleString()} • Confidence: {e.confidence}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="font-semibold text-slate-700">Neutrality</div>
                    <div>Score: {e.neutrality.score}/100</div>
                    {e.neutrality.flagged.length > 0 && (
                      <div>Flagged: {e.neutrality.flagged.join(', ')}</div>
                    )}
                    <NeutralityGauge score={e.neutrality.score} />
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="font-semibold text-slate-700">Bias Tally</div>
                    <BiasBars counts={e.bias} />
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="font-semibold text-slate-700">Bias Radar</div>
                  <BiasRadar values={{
                    sentiment: Math.max(0, Math.min(100, 50 + (e.bias['1'] + e.bias['2'] - e.bias['-1'] - e.bias['-2']) * 10)),
                    frame: Math.max(0, Math.min(100, 60 - (e.neutrality.flagged.length * 5))),
                    omission: Math.max(0, Math.min(100, 70 - (e.coverage.length < 3 ? 20 : 0))),
                    diversity: Math.max(0, Math.min(100, Math.round((e.coverage.length / 6) * 100))),
                  }} />
                  </div>
                </div>
                {e.coverage?.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-600">Coverage ({e.coverage.length})</summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {e.coverage.map((c: any, i: number) => (
                        <li key={i} className="flex items-center justify-between">
                          <span className="truncate max-w-[70%]">{c.headline}</span>
                          <span className="text-slate-600">lean: {c.lean ?? 'n/a'}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
            {verifyGroups && (
              <div className="border rounded-lg p-3">
                <div className="font-semibold mb-2 text-sm">Matched News Groups</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(verifyGroups).map(([key, ids]) => (
                    <div key={key} className="bg-slate-50 rounded p-2">
                      <div className="font-medium truncate">{key}</div>
                      <div className="text-slate-600">Events: {ids.length}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
