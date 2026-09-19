'use client';

import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import { MenuIcon, CloseIcon, SunIcon, MoonIcon } from '@/components/icons';
import CommandSearch from '@/components/search/CommandSearch';

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

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

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
          AJ
        </div>
      </div>
    </header>
  );
}
