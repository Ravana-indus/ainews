export default function BiasChip({ score }: { score: -2 | -1 | 0 | 1 | 2 }) {
  const colors = {
    '-2': 'bg-red-100 text-red-800',
    '-1': 'bg-red-50 text-red-700',
    '0': 'bg-slate-100 text-slate-700',
    '1': 'bg-green-50 text-green-700',
    '2': 'bg-green-100 text-green-800',
  } as const;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${colors[String(score) as '-2' | '-1' | '0' | '1' | '2']}`}>
      {score === 0 ? 'Neutral 0' : score > 0 ? `Favorable +${score}` : `Critical ${score}`}
    </span>
  );
}

