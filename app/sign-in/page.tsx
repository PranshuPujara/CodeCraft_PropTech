'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFriendlyErrorMessage = (error: string | null) => {
    if (!error) return null;
    if (error === 'OAuthSignin' || error === 'OAuthCallback') {
      return 'Unable to connect to Google. Please check your credentials and try again.';
    }
    if (error === 'AccessDenied') {
      return 'Sign in request was cancelled or access was denied.';
    }
    if (error === 'Configuration') {
      return 'Google OAuth is awaiting environment setup (AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET).';
    }
    return 'Authentication could not be completed. Please try again.';
  };

  const errorMessage = getFriendlyErrorMessage(errorParam);

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await signIn('google', { callbackUrl });
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm text-center">
        {/* Brand Icon */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Rentwise Logo"
            width={56}
            height={56}
            className="h-14 w-14 rounded-2xl object-contain shadow-sm"
            priority
          />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Rental Intelligence
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Make smarter rental decisions.
        </p>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-left text-xs leading-relaxed text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Sign In Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            {/* Google G logo */}
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Small supporting text */}
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Secure sign-in with Google
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <SignInContent />
    </Suspense>
  );
}
