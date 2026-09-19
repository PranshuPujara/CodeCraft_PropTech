import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import { authConfig } from '@/auth.config';

const isConfigured = Boolean(
  process.env.AUTH_SECRET &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET
);

if (!isConfigured && process.env.NODE_ENV !== 'production') {
  console.warn(
    '\n[Auth.js Setup Required]: Missing one or more environment variables in .env:\n' +
    (!process.env.AUTH_SECRET ? ' - AUTH_SECRET\n' : '') +
    (!process.env.AUTH_GOOGLE_ID ? ' - AUTH_GOOGLE_ID\n' : '') +
    (!process.env.AUTH_GOOGLE_SECRET ? ' - AUTH_GOOGLE_SECRET\n' : '') +
    'Please set these values in your .env file to enable Google OAuth authentication.\n'
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
});
