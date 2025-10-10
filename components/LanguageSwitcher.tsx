'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'si', label: 'සි' },
  { code: 'ta', label: 'த' },
];

import { useLang } from './LanguageProvider';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  function choose(code: string) {
    setLang(code as any);
    const next = new URL(window.location.href);
    next.searchParams.set('lang', code);
    router.push(next.pathname + '?' + next.searchParams.toString());
  }
  return (
    <div role="group" aria-label="Language" className="inline-flex rounded-full border overflow-hidden">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => choose(l.code)}
          className={`px-3 py-1 text-sm ${lang === l.code ? 'bg-blue-600 text-white' : 'bg-white text-slate-900'}`}
          aria-pressed={lang === l.code}
          aria-label={`Switch language to ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
