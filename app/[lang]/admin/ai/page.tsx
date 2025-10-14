"use client";
import * as React from 'react';

export default function AdminAI() {
  const [endpoint, setEndpoint] = React.useState('/api/ai/summarize');
  const [remoteEndpoint, setRemoteEndpoint] = React.useState<string>('');
  const [apiKey, setApiKey] = React.useState<string>('');
  const [remember, setRemember] = React.useState<boolean>(true);
  const [payload, setPayload] = React.useState(() => JSON.stringify({
    text: 'Sample article text',
    model: 'gpt-5-mini',
    endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || '',
  }, null, 2));
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // hydrate from localStorage for convenience
    try {
      const ep = localStorage.getItem('azureEndpoint') || process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '';
      const key = localStorage.getItem('azureApiKey') || '';
      setRemoteEndpoint(ep);
      setApiKey(key);
    } catch {}
  }, []);

  const callApi = async () => {
    setLoading(true);
    try {
      // Merge endpoint/apiKey from inputs if missing in payload
      let body: any = {};
      try { body = JSON.parse(payload); } catch { body = {}; }
      if (!body.endpoint) body.endpoint = remoteEndpoint;
      if (!body.apiKey) body.apiKey = apiKey;
      if (remember) {
        try {
          localStorage.setItem('azureEndpoint', remoteEndpoint || '');
          if (apiKey) localStorage.setItem('azureApiKey', apiKey);
        } catch {}
      }
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (e: any) {
      setResult('Error: ' + (e?.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-4">AI Endpoints</h1>
      <div className="border rounded-xl p-3">
        <label className="block text-sm mb-2">Admin API Route</label>
        <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-sm mb-1">Azure Responses Endpoint</label>
            <input value={remoteEndpoint} onChange={(e) => setRemoteEndpoint(e.target.value)} placeholder="https://.../openai/responses?api-version=..." className="border rounded px-2 py-1 text-sm w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">Azure API Key</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm mt-2">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember in browser
        </label>
        <label className="block text-sm mt-3 mb-2">Payload (JSON)</label>
        <textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="border rounded px-2 py-1 text-sm w-full h-40" />
        <button className="mt-3 px-3 py-1 border rounded-lg text-sm" onClick={callApi} disabled={loading}>{loading ? 'Calling…' : 'Call'}</button>
      </div>
      <div className="mt-4">
        <label className="block text-sm mb-2">Result</label>
        <pre className="border rounded-xl p-3 text-xs overflow-auto max-h-64 bg-slate-50">{result}</pre>
      </div>
    </main>
  );
}
