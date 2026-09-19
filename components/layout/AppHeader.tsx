'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import { MenuIcon, CloseIcon, SunIcon, MoonIcon } from '@/components/icons';
import CommandSearch from '@/components/search/CommandSearch';

export default function AppHeader() {
  const { data: session } = useSession();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : 'U';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 sm:px-6">
      {/* Left — hamburger + search */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 xl:hidden dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="Toggle sidebar"
        >
          {isMobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 xl:flex dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="w-4 h-4" />
        </button>

        {/* Mobile logo */}
        <span className="flex items-center gap-2 font-bold text-gray-900 xl:hidden dark:text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs text-white">R</span>
          Rentwise
        </span>

        {/* Command Palette Search */}
        <CommandSearch />
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        {/* User profile / sign out menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-emerald-100 text-xs font-bold text-emerald-800 transition hover:ring-2 hover:ring-emerald-500/30 dark:border-gray-700 dark:bg-emerald-900/50 dark:text-emerald-300"
            aria-label="Open user menu"
            aria-expanded={isMenuOpen}
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || 'User avatar'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2">
                <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'Authenticated User'}
                </p>
                {user?.email && (
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                )}
              </div>
              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              <button
                onClick={() => signOut({ callbackUrl: '/sign-in' })}
                className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
