import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token?.id) {
          session.user.id = token.id as string;
        } else if (token?.sub) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || 'development-build-secret-placeholder-32chars',
  trustHost: true,
} satisfies NextAuthConfig;
