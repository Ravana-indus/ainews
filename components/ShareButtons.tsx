"use client";
export default function ShareButtons() {
  const copyLink = () => {
    try { navigator.clipboard?.writeText(window.location.href); } catch {}
  };
  const openShare = (url: string) => {
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch {}
  };
  const href = typeof window !== 'undefined' ? window.location.href : '';
  return (
    <div className="flex gap-2">
      <button className="px-3 py-1 border rounded-lg text-sm" onClick={copyLink}>Copy link</button>
      <button className="px-3 py-1 border rounded-lg text-sm" onClick={() => openShare(`https://api.whatsapp.com/send?text=${encodeURIComponent(href)}`)}>WhatsApp</button>
      <button className="px-3 py-1 border rounded-lg text-sm" onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodeURIComponent(href)}`)}>X</button>
      <button className="px-3 py-1 border rounded-lg text-sm" onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(href)}`)}>Facebook</button>
    </div>
  );
}
