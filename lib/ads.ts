export type AdSettings = {
  enabled: boolean;
  feedFrequency: number; // insert ad after every N items
  eventInline: boolean; // show inline ad on event page
};

export function parseBool(val: string | undefined): boolean {
  return val === 'true' || val === '1';
}

export function getAdSettingsFromCookieHeader(cookieHeader?: string): AdSettings {
  const get = (name: string) => {
    if (!cookieHeader) return undefined;
    const match = new RegExp(`(?:^|; )${name}=([^;]+)`).exec(cookieHeader);
    return match ? decodeURIComponent(match[1]) : undefined;
  };
  const enabled = parseBool(get('adsEnabled'));
  const feedFrequencyStr = get('feedFrequency');
  const eventInline = parseBool(get('eventInline'));
  const feedFrequencyNum = Number(feedFrequencyStr ?? '0');
  const feedFrequency = Number.isFinite(feedFrequencyNum) && feedFrequencyNum > 0 ? feedFrequencyNum : 0;
  return { enabled, feedFrequency, eventInline };
}
