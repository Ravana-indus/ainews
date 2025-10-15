'use client';

import type { EventItem, LanguageCode } from '../lib/mocks';
import type { AdSettings } from '../lib/ads';
import InfiniteList from './InfiniteList';
import EventCard from './EventCard';
import AdsPlaceholder from './AdsPlaceholder';

type Props = {
  events: EventItem[];
  lang: LanguageCode;
  adSettings: AdSettings;
};

export default function EventFeed({ events, lang, adSettings }: Props) {
  if (!events.length) {
    return null;
  }

  const shouldShowAds = adSettings.enabled && adSettings.feedFrequency > 0;

  return (
    <InfiniteList
      items={events}
      pageSize={5}
      render={(evt, idx) => (
        <div className="mb-6">
          <EventCard evt={evt} lang={lang} />
          {shouldShowAds && (idx + 1) % adSettings.feedFrequency === 0 && (
            <div className="mt-4">
              <AdsPlaceholder position="inline" />
            </div>
          )}
        </div>
      )}
    />
  );
}

