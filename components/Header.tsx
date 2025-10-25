import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import { Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between mb-4">
      <Link href="/" className="font-semibold text-slate-900 dark:text-white">SriLankaLens.ai</Link>
      <div className="flex items-center gap-3">
        <Link
          href="/search"
          aria-label="Search"
          className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white transition-colors"
        >
          <Search size={16} />
        </Link>
        <DarkModeToggle />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
