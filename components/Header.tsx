import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between mb-4">
      <Link href="/" className="font-semibold">SriLankaLens.ai</Link>
      <div className="flex items-center gap-3">
        <Link href="/search" aria-label="Search" className="p-2 rounded-lg border hover:bg-slate-50"><Search size={16} /></Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
