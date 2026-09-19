import { auth } from '@/auth';

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/**
 * Safely retrieves the authenticated user from Auth.js session.
 * Gracefully handles unit testing environments where Next.js headers()
 * is called outside a request scope.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const session = await auth();
    return (session?.user as AuthUser) ?? null;
  } catch {
    // Outside request context (e.g., unit tests)
    return null;
  }
}
