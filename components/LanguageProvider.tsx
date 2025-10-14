'use client';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';

type Lang = 'en' | 'si' | 'ta';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

const LanguageContext = createContext<Ctx | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initialLang && initialLang !== lang) {
      setLangState(initialLang);
    }
  }, [initialLang, lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.cookie = `lang=${l}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = l;

    // Replace the language part of the URL and push the new path
    const newPath = pathname.replace(/^\/(en|si|ta)/, `/${l}`);
    router.push(newPath);
  };

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}