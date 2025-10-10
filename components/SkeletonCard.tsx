export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border p-4">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="mt-2 h-3 bg-slate-200 rounded w-full" />
      <div className="mt-1 h-3 bg-slate-200 rounded w-5/6" />
      <div className="mt-4 h-3 bg-slate-200 rounded w-2/3" />
    </div>
  );
}

