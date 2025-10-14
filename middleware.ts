import { NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en', 'si', 'ta'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  let languages: string[] | undefined;
  try {
    languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  } catch (error) {
    // Handle potential errors if headers are invalid
    languages = [];
  }

  try {
    return match(languages, locales, defaultLocale);
  } catch (e) {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API, Next.js specific folders, and static assets
  if (pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      /\..*$/.test(pathname)) {
    return NextResponse.next();
  }

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const cookieLocale = request.cookies.get('lang')?.value;
    const locale = cookieLocale || getLocale(request);

    // Clone the URL to modify it
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/${locale}${pathname}`;

    return NextResponse.redirect(newUrl);
  }

  const response = NextResponse.next();
  const lang = pathname.split('/')[1];
  if (locales.includes(lang) && request.cookies.get('lang')?.value !== lang) {
    response.cookies.set('lang', lang, { path: '/', maxAge: 31536000 });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Optional: only run on root (/) URL
    // '/'
  ],
};