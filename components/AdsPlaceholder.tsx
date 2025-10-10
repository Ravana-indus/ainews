export default function AdsPlaceholder({ position = 'inline' }: { position?: 'inline' | 'sidebar' | 'footer' }) {
  const label = position === 'inline' ? 'Inline Ad Placeholder' : position === 'sidebar' ? 'Sidebar Ad Placeholder' : 'Footer Ad Placeholder';
  return (
    <div className="border-2 border-dashed rounded-xl p-4 text-center text-sm text-slate-600 bg-slate-50" aria-label="Advertisement">
      {label}
    </div>
  );
}
