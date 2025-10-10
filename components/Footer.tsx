import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-8 text-xs text-slate-500">
      <Link href="/about">About</Link> • <Link href="/methodology">Methodology</Link> • <Link href="/sources">Sources</Link> • <Link href="/privacy">Privacy</Link> • <Link href="/terms">Terms</Link>
    </footer>
  );
}
