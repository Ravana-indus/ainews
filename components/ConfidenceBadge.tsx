export default function ConfidenceBadge({ value }: { value: number }) {
  const variant = value < 50 ? 'bg-amber-100 text-amber-800' : value < 80 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  return (
    <span className={`inline-block px-2 py-1 text-xs rounded-full ${variant}`} title="Confidence computed from sources and reliability">
      {value}%
    </span>
  );
}

