'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'en' | 'si' | 'ta';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

const LanguageContext = createContext<Ctx | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const deepLink = params.get('lang');
      const stored = localStorage.getItem('langPreference');
      if (stored === 'en' || stored === 'si' || stored === 'ta') {
        setLangState(stored);
      } else if (deepLink === 'en' || deepLink === 'si' || deepLink === 'ta') {
        setLangState(deepLink as Lang);
      }
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('langPreference', l);
      document.cookie = `lang=${l}; path=/`;
      document.documentElement.lang = l;
    } catch {}
  };
  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
