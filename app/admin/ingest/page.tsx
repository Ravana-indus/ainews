"use client";
import * as React from 'react';

export default function AdminIngest() {
  const [method, setMethod] = React.useState<'rss' | 'scrape' | 'manual'>('rss');
  const [adminToken, setAdminToken] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // RSS State
  const [rssAmount, setRssAmount] = React.useState(3);

  // Scrape State
  const [scrapeUrl, setScrapeUrl] = React.useState('');

  // Manual State
  const [manualTitle, setManualTitle] = React.useState('');
  const [manualUrl, setManualUrl] = React.useState('');
  const [manualContent, setManualContent] = React.useState('');
  const [manualSource, setManualSource] = React.useState('');

  React.useEffect(() => {
    try {
      const t = localStorage.getItem('admin_token') || '';
      if (t) setAdminToken(t);
    } catch {}
  }, []);

  async function handleRssFetch() {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
        body: JSON.stringify({ amount: rssAmount })
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleScrape() {
    if (!scrapeUrl) {
      setResult('Please enter a URL to scrape');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
        body: JSON.stringify({ url: scrapeUrl })
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCreate() {
    if (!manualTitle || !manualUrl) {
      setResult('Please fill in at least title and URL');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
        body: JSON.stringify({
          title: manualTitle,
          url: manualUrl,
          content: manualContent,
          source: manualSource,
        })
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
      if (json.ok) {
        setManualTitle('');
        setManualUrl('');
        setManualContent('');
        setManualSource('');
      }
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-screen-md p-4">
      <h1 className="text-lg font-semibold mb-3">Admin • News Ingestion</h1>

      <div className="border rounded-xl p-3 mb-4 text-sm">
        <div className="font-medium mb-2">Admin Token</div>
        <input
          className="border rounded-lg p-2 text-sm w-full"
          placeholder="Admin Token"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
        />
      </div>

      {/* Method Selector */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg border ${method === 'rss' ? 'bg-blue-600 text-white' : ''}`}
          onClick={() => setMethod('rss')}
        >
          📡 RSS Feeds
        </button>
        <button
          className={`px-4 py-2 rounded-lg border ${method === 'scrape' ? 'bg-blue-600 text-white' : ''}`}
          onClick={() => setMethod('scrape')}
        >
          🕷️ Web Scraper
        </button>
        <button
          className={`px-4 py-2 rounded-lg border ${method === 'manual' ? 'bg-blue-600 text-white' : ''}`}
          onClick={() => setMethod('manual')}
        >
          ✍️ Manual Entry
        </button>
      </div>

      {/* RSS Method */}
      {method === 'rss' && (
        <div className="border rounded-xl p-4 mb-4">
          <h2 className="font-semibold mb-3">Fetch from RSS Feeds</h2>
          <p className="text-sm text-slate-600 mb-3">
            Automatically fetch articles from configured RSS feeds in your sources.
          </p>
          <label className="block mb-3">
            <span className="text-sm">Number of articles</span>
            <input
              type="number"
              min={1}
              max={20}
              value={rssAmount}
              onChange={(e) => setRssAmount(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm w-full mt-1"
            />
          </label>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={handleRssFetch}
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch from RSS'}
          </button>
        </div>
      )}

      {/* Scrape Method */}
      {method === 'scrape' && (
        <div className="border rounded-xl p-4 mb-4">
          <h2 className="font-semibold mb-3">Scrape Article from URL</h2>
          <p className="text-sm text-slate-600 mb-3">
            Extract article content directly from any webpage URL.
          </p>
          <label className="block mb-3">
            <span className="text-sm">Article URL</span>
            <input
              type="url"
              placeholder="https://example.com/article"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-full mt-1"
            />
          </label>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={handleScrape}
            disabled={loading}
          >
            {loading ? 'Scraping...' : 'Scrape Article'}
          </button>
        </div>
      )}

      {/* Manual Method */}
      {method === 'manual' && (
        <div className="border rounded-xl p-4 mb-4">
          <h2 className="font-semibold mb-3">Manual Article Entry</h2>
          <p className="text-sm text-slate-600 mb-3">
            Manually create an event by entering article details.
          </p>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm">Title *</span>
              <input
                placeholder="Article title"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full mt-1"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm">URL *</span>
              <input
                type="url"
                placeholder="https://example.com/article"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full mt-1"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm">Source ID (optional)</span>
              <input
                placeholder="Source UUID from /admin/sources"
                value={manualSource}
                onChange={(e) => setManualSource(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full mt-1"
              />
            </label>
            <label className="block">
              <span className="text-sm">Content (optional)</span>
              <textarea
                placeholder="Article content or summary..."
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full mt-1"
                rows={6}
              />
            </label>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg mt-3"
            onClick={handleManualCreate}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="border rounded-xl p-4 bg-slate-50">
          <h3 className="font-semibold mb-2">Result</h3>
          <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </main>
  );
}
