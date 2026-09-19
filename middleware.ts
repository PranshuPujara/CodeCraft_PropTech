import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const pathname = nextUrl.pathname;
  const isSignInPage = pathname === '/sign-in';
  const isApiAuthRoute = pathname.startsWith('/api/auth');

  // If user visits /dashboard, handle redirection
  if (pathname === '/dashboard') {
    if (!isLoggedIn) {
      const signInUrl = new URL('/sign-in', nextUrl);
      signInUrl.searchParams.set('callbackUrl', '/dashboard');
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // If already authenticated and visits /sign-in -> redirect to /dashboard
  if (isSignInPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  // Allow auth API routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Protected application routes
  const protectedPrefixes = [
    '/',
    '/saved',
    '/compare',
    '/agreements',
    '/roommates',
    '/roommate',
    '/assistant',
    '/decision-assistant',
    '/copilot',
    '/recommendations',
    '/discover',
    '/properties',
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL('/sign-in', nextUrl);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
