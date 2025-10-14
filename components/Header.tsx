'use client';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { Search } from 'lucide-react';
import { useLang } from './LanguageProvider';

export default function Header() {
  const { lang } = useLang();
  return (
    <header className="flex items-center justify-between mb-4">
      <Link href={`/${lang}`} className="font-semibold">SriLankaLens.ai</Link>
      <div className="flex items-center gap-3">
        <Link href={`/${lang}/search`} aria-label="Search" className="p-2 rounded-lg border hover:bg-slate-50"><Search size={16} /></Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
