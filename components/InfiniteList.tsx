'use client';
import { useEffect, useRef, useState } from 'react';

export default function InfiniteList<T>({
  items,
  pageSize = 10,
  render,
}: {
  items: T[];
  pageSize?: number;
  render: (item: T, idx: number) => React.ReactNode;
}) {
  const [visible, setVisible] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisible((v) => Math.min(v + pageSize, items.length));
      }
    });
    ob.observe(el);
    return () => ob.disconnect();
  }, [items.length, pageSize]);
  return (
    <div>
      {items.slice(0, visible).map((item, i) => (
        <div key={i}>{render(item, i)}</div>
      ))}
      <div ref={sentinelRef} className="h-8" aria-hidden />
    </div>
  );
}

