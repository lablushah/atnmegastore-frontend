import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Paths that skip locale routing AND maintenance redirect
const SKIP_PREFIXES = [
  '/admin',
  '/_next', '/api', '/favicon', '/logo', '/robots', '/sitemap',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const skip = SKIP_PREFIXES.some((p) => pathname.startsWith(p));

  // Run locale middleware for all public routes
  if (!skip) {
    const intlResponse = intlMiddleware(request);
    // If intl redirects/rewrites (locale prefix needed), return immediately
    if (intlResponse.status >= 300 && intlResponse.status < 400) {
      return intlResponse;
    }

    // Check maintenance mode, preserving intl locale headers
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api';
      const res = await fetch(`${apiBase}/maintenance`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data: { enabled: boolean; message: string; return_time: string | null } = await res.json();
        if (data.enabled) {
          const url = request.nextUrl.clone();
          url.pathname = `/${intlResponse.headers.get('x-next-intl-locale') ?? 'en'}/maintenance`;
          url.searchParams.set('msg', data.message);
          if (data.return_time) url.searchParams.set('eta', data.return_time);
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // API unreachable — let through
    }

    return intlResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)'],
};
