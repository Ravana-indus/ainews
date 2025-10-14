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

import './globals.css';
import { LanguageProvider } from '../../components/LanguageProvider';
import { ToastProvider } from '../../components/Toast';

export const metadata = {
  title: 'SriLankaLens.ai',
  description: 'Tri-lingual AI news platform',
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: 'en' | 'si' | 'ta' };
}) {
  return (
    <html lang={params.lang ?? 'en'}>
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white border rounded px-3 py-2 text-sm">Skip to content</a>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0F172A" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/${params.lang}`} />
        <link rel="sitemap" type="application/xml" href="/api/sitemap" />
        <LanguageProvider initialLang={params.lang}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
