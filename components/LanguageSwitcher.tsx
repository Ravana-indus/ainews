'use client';
import { useLang } from './LanguageProvider';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const langs = [
  { code: 'en', label: 'EN', fullName: 'English' },
  { code: 'si', label: 'සි', fullName: 'Sinhala' },
  { code: 'ta', label: 'த', fullName: 'Tamil' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [isDesktop, setIsDesktop] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handler = () => setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    setIsDesktop(mediaQuery.matches); // Set initial state
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  function choose(code: 'en' | 'si' | 'ta') {
    setLang(code);
    setOpen(false); // Close drawer on selection
  }

  if (isDesktop) {
    return (
      <div role="group" aria-label="Language" className="inline-flex rounded-full border overflow-hidden text-sm">
        {langs.map((l) => (
          <button
            key={l.code}
            onClick={() => choose(l.code)}
            className={`px-3 py-1 ${lang === l.code ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            aria-pressed={lang === l.code}
            aria-label={`Switch language to ${l.fullName}`}
          >
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="p-2 rounded-lg border hover:bg-slate-50" aria-label="Open language switcher">
          <Globe size={16} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Select Language</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 pt-0">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`w-full text-left p-3 rounded-md text-lg ${lang === l.code ? 'bg-slate-100 font-semibold' : ''}`}
            >
              <span className="mr-2">{l.label}</span>{l.fullName}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}