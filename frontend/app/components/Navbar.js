'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export default function Navbar() {
  const { user, isLoading } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-800 transition-colors hover:text-blue-600">
              Law & Verdict
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {!isLoading && !user && (
              <a
                href="/api/auth/login"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-blue-700"
              >
                Log In
              </a>
            )}
            {!isLoading && user && (
              <Link href="/me" className="transition-transform hover:scale-110">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
