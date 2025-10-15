export type Lang = 'en' | 'si' | 'ta';

type Dict = Record<string, { en: string; si: string; ta: string }>;

export const messages: Dict = {
  back: { en: '← Back', si: '← නැවත', ta: '← பின்செல்' },
  eventNotFound: { en: 'Event not found.', si: 'සිද්ධිය සොයා ගත නොහැක.', ta: 'நிகழ்வு கிடைக்கவில்லை.' },
  lastUpdated: { en: 'Last updated', si: 'අවසන් යාවත්කාල', ta: 'கடைசியாக புதுப்பிக்கப்பட்டது' },
  hourly: { en: 'Hourly', si: 'පැණිතිව', ta: 'மணிநேரம்' },
  avgConfidence: { en: 'Avg confidence', si: 'මධ්‍යස්ථ විශ්වාසය', ta: 'சராசரி நம்பிக்கை' },
  latestFromSources: { en: 'Latest from sources', si: 'නවතම සම්භන්ධ', ta: 'மூலங்களில் இருந்து சமீபத்தியது' },
  noStories: { en: 'No fresh stories yet. Next update at', si: 'නව කථා නැත. ඊළඟ යාවත්කාලය', ta: 'புதிய செய்திகள் இல்லை. அடுத்த புதுப்பிப்பு' },
  clearFilters: { en: 'Clear', si: 'හැරදමන්න', ta: 'அழி' },
  outletsFramed: { en: 'How different outlets framed it', si: 'විවිධ මාධ්‍ය එය සකස් කළ ආකාරය', ta: 'வேறுபட்ட ஊடகங்கள் அதை எவ்வாறு வடிவமைத்தன' },
  biasRadar: { en: 'Bias Radar', si: 'පක්ෂපාත රේඩාර්', ta: 'பாகுபாட்டு ரேடார்' },
  legendBias: { en: 'Sentiment • Frame • Omission • Diversity', si: 'භාව • රාමුව • වැළැක්වීම • විවිධත්වය', ta: 'உணர்வு •枠 • தவிர்ப்பு • பன்மை' },
  related: { en: 'Related', si: 'සම්බන්ධිත', ta: 'தொடர்புடைய' },
  share: { en: 'Share', si: 'හවුල් වන්න', ta: 'பகிர்' },
  timeline: { en: 'Timeline', si: 'කාල දර්ශකය', ta: 'காலவரிசை' },
  openEvent: { en: 'Open event →', si: 'සිද්ධිය විවෘත කරන්න →', ta: 'நிகழ்வை திறக்க →' },
  readSource: { en: 'Read source', si: 'මුලාශ්‍රය කියවන්න', ta: 'மூலத்தை படிக்கவும்' },
  aiDecided: { en: 'How AI Decided', si: 'AI තීරණය කළ ආකාරය', ta: 'AI எவ்வாறு முடிவு செய்தது' },
  sourcesUsed: { en: 'Sources used and lean reasoning:', si: 'භාවිත සම්භන්ද සහ lean හේතුව:', ta: 'பயன்படுத்திய மூலங்கள் மற்றும் சாய்வு காரணம்:' },
  subscribeTitle: { en: 'Subscribe to the daily newsletter', si: 'දිනපතා නිවේදනයට දායක වන්න', ta: 'தினசரி செய்திமடலுக்கு பதிவு செய்யவும்' },
  subscribeDesc: { en: 'Neutral morning brief at 7am. Unsubscribe anytime.', si: 'නිරපේක්ෂ පෙරවරැයේ බෘෆ් 7am. ඕනෑම වේලාවක ඉවත් විය හැක.', ta: 'நடுநிலை காலை சுருக்கம் 7am. எப்போதும் ரத்து செய்யலாம்.' },
  exploreTopics: { en: 'Explore Topics', si: 'මාතෘකා අනුව', ta: 'தலைப்புகளை ஆராயுங்கள்' },
};

export function t(key: keyof typeof messages, lang: Lang): string {
  const entry = messages[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}
