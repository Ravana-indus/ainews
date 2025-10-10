"use client";
import { useState } from 'react';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [lang, setLang] = useState<'en'|'si'|'ta'>('en');
  const [status, setStatus] = useState<'idle'|'ok'|'error'>('idle');
  const [msg, setMsg] = useState('');
  async function subscribe() {
    setStatus('idle');
    setMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('ok');
      setMsg('Subscribed. Check your inbox.');
      setEmail('');
    } catch (e: any) {
      setStatus('error');
      setMsg(e.message || 'Subscription failed');
    }
  }
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-lg font-semibold mb-2">Newsletter Signup</h1>
      <p className="text-sm text-slate-700 mb-4">We’ll email daily at 7am. Unsubscribe anytime.</p>
      <form className="space-y-3" aria-label="Newsletter signup form" onSubmit={(e) => { e.preventDefault(); subscribe(); }}>
        <input type="email" placeholder="Email" className="w-full border rounded-lg p-2" required aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="w-full border rounded-lg p-2" aria-label="Language preference" value={lang} onChange={(e) => setLang(e.target.value as any)}>
          <option value="en">English</option>
          <option value="si">Sinhala</option>
          <option value="ta">Tamil</option>
        </select>
        <button type="submit" className="w-full bg-blue-600 text-white rounded-lg p-2">Subscribe</button>
      </form>
      {status !== 'idle' && (
        <div className={`mt-4 text-sm ${status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{msg}</div>
      )}
    </main>
  );
}
