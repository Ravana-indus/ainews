export type SiteSettings = {
  defaultLang: 'en' | 'si' | 'ta';
  showBiasRadar: boolean;
  showTransparencyPanel: boolean;
  showNewsletterCard: boolean;
};

function parseBool(val: string | undefined): boolean {
  return val === 'true' || val === '1';
}

export function getSiteSettingsFromCookieHeader(cookieHeader?: string): SiteSettings {
  const get = (name: string) => {
    if (!cookieHeader) return undefined;
    const match = new RegExp(`(?:^|; )${name}=([^;]+)`).exec(cookieHeader);
    return match ? decodeURIComponent(match[1]) : undefined;
  };
  const defaultLang = (get('defaultLang') as any) || 'en';
  const showBiasRadar = parseBool(get('showBiasRadar'));
  const showTransparencyPanel = parseBool(get('showTransparencyPanel'));
  const showNewsletterCard = parseBool(get('showNewsletterCard'));
  const isLang = defaultLang === 'en' || defaultLang === 'si' || defaultLang === 'ta' ? defaultLang : 'en';
  return { defaultLang: isLang, showBiasRadar, showTransparencyPanel, showNewsletterCard };
}
