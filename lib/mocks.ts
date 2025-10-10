export type LanguageCode = 'en' | 'si' | 'ta';

export type Source = {
  id: string;
  name: string;
  domain: string;
  language: LanguageCode;
  reliability: number;
  logoUrl: string;
};

export type SourceCoverage = {
  sourceId: string;
  headline: string;
  lean: -2 | -1 | 0 | 1 | 2;
  reason: string;
  url: string;
  publishedAt: string;
};

export type EventItem = {
  id: string;
  title: string;
  summary: { en: string; si: string; ta: string };
  detail: { en: string; si: string; ta: string };
  updatedAt: string;
  confidence: number;
  category: string;
  sources: SourceCoverage[];
  biasSummary: { sourceId: string; score: -2 | -1 | 0 | 1 | 2; label: string }[];
};

export type KPI = {
  articles24h: number;
  eventsCreated: number;
  summariesGenerated: number;
  failures: number;
  avgConfidence: number;
};

export const sources: Source[] = [
  { id: 'src_adaderana', name: 'Ada Derana', domain: 'adaderana.lk', language: 'si', reliability: 0.84, logoUrl: '/logos/adaderana.png' },
  { id: 'src_newsfirst', name: 'NewsFirst', domain: 'newsfirst.lk', language: 'si', reliability: 0.82, logoUrl: '/logos/newsfirst.png' },
  { id: 'src_dailymirror', name: 'Daily Mirror', domain: 'dailymirror.lk', language: 'en', reliability: 0.86, logoUrl: '/logos/dailymirror.png' },
  { id: 'src_tamilguardian', name: 'Tamil Guardian', domain: 'tamilguardian.com', language: 'ta', reliability: 0.8, logoUrl: '/logos/tamilguardian.png' },
];

export const events: EventItem[] = [
  {
    id: 'evt_001',
    title: 'Fuel prices revised amid global crude fluctuation',
    summary: {
      en: 'The government announced a fuel price revision citing international crude volatility and domestic fiscal adjustments. Multiple outlets reported differing emphasis on consumer impact and policy rationale.',
      si: 'රජය ග්‍රෑඩ් මිල ඉහළ පහළ යා ගැන සහ දේශීය මුදල් ප්‍රතිසංස්කරණය දක්වා ඉන්ධන මිල සංශෝධනයක් ප්‍රකාශ කළා. outlet කිහිපයක් පාරිභෝගික බලපෑම සහ ප්‍රතිපත්ති හේතු වෙනස් වශයෙන් අවධාරණය කළා.',
      ta: 'அரசு சர்வதேச எண்ணெய் விலை மாற்றம் மற்றும் உள்நாட்டு நிதி சரிசெய்தல் காரணமாக எரிபொருள் விலை திருத்தத்தை அறிவித்தது. பல ஊடகங்கள் நுகர்வோர் தாக்கம் மற்றும் கொள்கை காரணங்களை மாறுபட்ட மையமாகக் கூறின.',
    },
    detail: {
      en: `According to the Energy Ministry, the revision aligns pump prices with recent import costs and exchange rate movements. Officials said subsidies remain targeted for low-income households via transport vouchers. Critics argue the timing burdens commuters ahead of the holiday season, while supporters cite fiscal consolidation goals tied to IMF benchmarks. Outlets differed on whether the change was consumer-first or budget-first, reflecting broader debates around inflation management and state revenue.`,
      si: `ජාතික එනර්ජි අමාත්‍යාංශය පවසන්නේ, නව මිල ගණන් ගෙන්වීම් වියදම සහ විනිමය අනුපාත චලිතයන් සමග සමාන කිරීමක් බවයි. අඩු ආදායම් පවුල් සඳහා වාහන වවුචර් මඟින් ඉල්ලීම් ක්ෂණික සහන ලබා දෙන බව නිලධාරීන් කියාසිටියහ. විවේචකයින් දක්වන්නේ මෙම හුදෙදින කාලයෙහි ගමනුන්ට බරක් බවයි; සහායකයින් පවසන්නේ IMF ඉලක්ක සමග බැඳුණු මුදල් ප්‍රතිසංස්කරණය සාර්ථක කිරීමට මෙය අවශ්‍ය බවයි. මාධ්‍ය පිටුපස ප්‍රධාන අවධාරණය පාරිභෝගික කොටසද හෝ රාජ්‍ය අයවැයද යන්න මත වෙනස් විය.`,
      ta: `எரிசக்தி அமைச்சகத்தின் படி, புதிய விலைகள் சமீபத்திய இறக்குமதி செலவும் विनிமயம் மாற்றங்களும் இணக்கமாக அமைக்கப்பட்டுள்ளன. குறைந்த வருமான குடும்பங்களுக்கு போக்குவரத்து வவுச்சர் மூலம் இலக்கு சலுகைகள் தொடரும் என அதிகாரிகள் தெரிவித்தனர். விமர்சகர்கள் விடுமுறை காலத்திற்கு முன் பயணிகளுக்கு சுமை அதிகரிக்கும் எனக் கூற, ஆதரவாளர்கள் IMF இலக்குகளுடன் தொடர்புடைய நிதி ஒழுங்குமுறையை முன்னிறுத்தினர். ஊடகங்கள் மாற்றம் நுகர்வோருக்கா அல்லது பட்ஜெட்டுக்கா என்ற மையத்தை மாறுபடுத்தின.`,
    },
    updatedAt: '2025-10-09T10:00:00Z',
    confidence: 78,
    category: 'Economy',
    sources: [
      { sourceId: 'src_adaderana', headline: 'இන්ධන මිල වැඩි — ජනතාවට වැඩි බර', lean: -1, reason: 'Focus on citizen burden', url: 'https://adaderana.lk/a1', publishedAt: '2025-10-09T08:45:00Z' },
      { sourceId: 'src_newsfirst', headline: 'Fuel price revised; ministry cites global crude', lean: 0, reason: 'Neutral policy framing', url: 'https://newsfirst.lk/n1', publishedAt: '2025-10-09T08:50:00Z' },
      { sourceId: 'src_dailymirror', headline: 'Govt revises prices amid IMF targets', lean: 1, reason: 'Positive fiscal discipline', url: 'https://dailymirror.lk/d1', publishedAt: '2025-10-09T09:10:00Z' },
    ],
    biasSummary: [
      { sourceId: 'src_adaderana', score: -1, label: 'Critical −1' },
      { sourceId: 'src_newsfirst', score: 0, label: 'Neutral 0' },
      { sourceId: 'src_dailymirror', score: 1, label: 'Favorable +1' },
    ],
  },
  {
    id: 'evt_002',
    title: 'Cabinet approves education reforms pilot',
    summary: {
      en: 'A pilot program for curriculum modernization received cabinet approval, with emphasis on teacher training and digital content.',
      si: 'පාසල් විෂය ат modern කිරීම සඳහා පීලෝට් වැඩසටහනක් අමාත්‍යාංශ අනුමැතිය ලබා ගත්තා.',
      ta: 'பாடத்திட்ட நவீனமயமாதலுக்கான முன்முயற்சிக்கு அமைச்சரவை ஒப்புதல் அளித்தது.',
    },
    detail: {
      en: `The pilot will run across 50 schools in three provinces, focusing on competency-based modules, bilingual materials, and basic coding. Teacher upskilling includes weekend workshops and micro-credential certificates delivered online. The ministry targets a six-month evaluation window before scaling. Advocates highlight digital inclusion, while skeptics raise concerns about infrastructure gaps and training workloads.`,
      si: `මෙම පීලෝට් වැඩසටහන සබරගමුව, බස්නාහිර හා උතුරු පළාතවල පාසල් 50කට ක්‍රියාත්මක වන අතර කුසලතා-මූලික මාතෘකා, දෙ භාෂා අද්ධිපාදන සහ මූලික කෝඩින් Pel මත අවධානය යොමු කරයි. ආචාර්යවරුන් සඳහා පුනර්පුහුණු කිරීම සතිඅන්ත වැඩමුළු සහ ඩිජිටල් සර්ටිෆිකේට් මඟින් සිදු කරනු ඇත. මාස 6ක ඇගයීමක් පසු ප්‍රාදේශීය පරාමිතීන් පරිදි විස්තර කරනු ඇත.`,
      ta: `இந்த முன்முயற்சி மூன்று மாகாணங்களில் 50 பள்ளிகளில் நடக்கிறது; திறன்-அடிப்படையிலான தொகுதிகள், இருமொழி உள்ளடக்கங்கள், மற்றும் அடிப்படை குறியீடு ஆகியவற்றில் கவனம் செலுத்துகிறது. ஆசிரியர் பயிற்சி வார இறுதி பட்டறைகள் மற்றும் ஆன்லைன் சிறு அங்கீகார சான்றுகளால் மேற்கொள்ளப்படும். அமைச்சகம் ஆறு மாத மதிப்பீட்டுக்குப் பின் விரிவாக்கத்தை நோக்குகிறது.`,
    },
    updatedAt: '2025-10-09T09:30:00Z',
    confidence: 65,
    category: 'Education',
    sources: [
      { sourceId: 'src_newsfirst', headline: 'Cabinet clears pilot on education reforms', lean: 0, reason: 'Straight reporting', url: 'https://newsfirst.lk/n2', publishedAt: '2025-10-09T09:00:00Z' },
      { sourceId: 'src_tamilguardian', headline: 'Education reforms prioritize digital', lean: 1, reason: 'Positive tech framing', url: 'https://tamilguardian.com/t1', publishedAt: '2025-10-09T09:20:00Z' },
    ],
    biasSummary: [
      { sourceId: 'src_newsfirst', score: 0, label: 'Neutral 0' },
      { sourceId: 'src_tamilguardian', score: 1, label: 'Favorable +1' },
    ],
  },
];

export const kpi: KPI = {
  articles24h: 128,
  eventsCreated: 42,
  summariesGenerated: 40,
  failures: 3,
  avgConfidence: 74,
};

