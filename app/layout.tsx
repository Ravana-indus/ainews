import './globals.css';
export const metadata = {
  title: 'SriLankaLens.ai',
  description: 'Tri-lingual AI news platform',
  openGraph: {
    title: 'SriLankaLens.ai',
    description: 'Tri-lingual AI news platform',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SriLankaLens.ai',
    description: 'Tri-lingual AI news platform',
  },
};

import { LanguageProvider } from '../components/LanguageProvider';
import { ToastProvider } from '../components/Toast';
import { ThemeProvider } from '../components/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased transition-colors">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm">Skip to content</a>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Basic SEO meta */}
        <meta name="theme-color" content="#0F172A" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || ''} />
        <link rel="sitemap" type="application/xml" href="/api/sitemap" />
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
