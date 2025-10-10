export type NeutralityAnalysis = {
  score: number; // 0-100 higher is more neutral
  flagged: string[]; // words/phrases flagged
};

const SUBJECTIVE_WORDS = [
  'shocking', 'outrageous', 'disgraceful', 'heroic', 'disaster', 'catastrophe',
  'unprecedented', 'massive', 'huge', 'tiny', 'merely', 'clearly', 'obviously',
  'allegedly', 'reportedly', 'appears', 'seems', 'apparently', 'baseless', 'groundless',
];

export function analyzeNeutrality(text: string): NeutralityAnalysis {
  if (!text) return { score: 0, flagged: [] };
  const lower = text.toLowerCase();
  const flagged = SUBJECTIVE_WORDS.filter((w) => lower.includes(w));
  // Penalize for subjective words and for very short or very long sentences
  const sentences = text.split(/[.!?]+\s*/).filter(Boolean);
  const avgLen = sentences.length ? text.length / sentences.length : text.length;
  let score = 100;
  score -= flagged.length * 5;
  if (avgLen < 40) score -= 10;
  if (avgLen > 220) score -= 5;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, flagged };
}

export type BiasCounts = { '-2': number; '-1': number; '0': number; '1': number; '2': number };

export function tallyBias(leans: Array<number | null | undefined>): BiasCounts {
  const out: BiasCounts = { '-2': 0, '-1': 0, '0': 0, '1': 0, '2': 0 };
  for (const v of leans) {
    const k = String([ -2, -1, 0, 1, 2 ].includes(Number(v)) ? Number(v) : 0) as keyof BiasCounts;
    out[k]++;
  }
  return out;
}

