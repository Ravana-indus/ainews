export type Lang = 'en' | 'si' | 'ta';

export function getInitialLang(cookieHeader?: string): Lang {
  if (cookieHeader) {
    const match = /(?:^|; )lang=([^;]+)/.exec(cookieHeader);
    if (match) {
      const val = decodeURIComponent(match[1]);
      if (val === 'en' || val === 'si' || val === 'ta') return val;
    }
  }
  return 'en';
}

