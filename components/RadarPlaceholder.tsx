export default function RadarPlaceholder({ values }: { values: { sentiment: number; frame: number; omission: number; diversity: number } }) {
  return (
    <div className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
      Radar Chart Placeholder
    </div>
  );
}

