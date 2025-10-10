export default function Timeline({ steps }: { steps: { label: string; time: string }[] }) {
  return (
    <ol className="relative border-l border-slate-200 pl-4">
      {steps.map((s, i) => (
        <li key={i} className="mb-3">
          <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-blue-600" aria-hidden />
          <div className="text-sm font-medium">{s.label}</div>
          <div className="text-xs text-slate-600">{s.time}</div>
        </li>
      ))}
    </ol>
  );
}

