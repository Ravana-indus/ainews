'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

type ToastOptions = { actionLabel?: string; onAction?: () => void };

const ToastContext = createContext<{ showToast: (msg: string, opts?: ToastOptions) => void } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [opts, setOpts] = useState<ToastOptions | undefined>();
  const timeoutRef = useRef<number | null>(null);
  function showToast(m: string, o?: ToastOptions) {
    setMsg(m);
    setOpts(o);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setMsg(null), 4000);
  }
  useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {msg && (
        <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
          <span className="text-sm">{msg}</span>
          {opts?.actionLabel && (
            <button className="text-blue-300 text-sm" onClick={opts.onAction}>{opts.actionLabel}</button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

