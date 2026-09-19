'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSidebar } from '@/context/SidebarContext';
import { useUser } from '@/context/UserContext';
import BudgetModal from '@/components/budget/BudgetModal';
import {
  DashboardIcon,
  SearchIcon,
  BookmarkIcon,
  CompareIcon,
  DocumentIcon,
  UsersIcon,
  SparklesIcon,
  LightbulbIcon,
  ChatIcon,
} from '@/components/icons';

const navGroups = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', path: '/', icon: DashboardIcon },
      { label: 'Discover', path: '/discover', icon: SearchIcon },
      { label: 'Saved', path: '/saved', icon: BookmarkIcon },
      { label: 'Compare', path: '/compare', icon: CompareIcon },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { label: 'Agreements', path: '/agreements', icon: DocumentIcon },
      { label: 'Roommates', path: '/roommates', icon: UsersIcon },
      { label: 'Recommendations', path: '/recommendations', icon: SparklesIcon },
    ],
  },
  {
    title: 'AI',
    items: [
      { label: 'Decision Assistant', path: '/assistant', icon: LightbulbIcon },
      { label: 'AI Copilot', path: '/copilot', icon: ChatIcon },
    ],
  },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { budget, isLoading } = useUser();
  const pathname = usePathname();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const showFull = isExpanded || isHovered || isMobileOpen;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 xl:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900 ${
          showFull ? 'w-[272px]' : 'w-20'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full xl:translate-x-0'
        }`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className={`flex h-16 items-center gap-3 border-b border-gray-200 px-5 dark:border-gray-700 ${!showFull ? 'justify-center' : ''}`}>
          <Link href="/" className="flex items-center gap-3" onClick={() => isMobileOpen && toggleMobileSidebar()}>
            <Image
              src="/logo.png"
              alt="Rentwise Logo"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-xl object-contain shadow-sm"
              priority
            />
            {showFull && (
              <span className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
                  Rentwise
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Rental Intelligence
                </span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="no-scrollbar flex-1 overflow-y-auto px-4 py-6">
          <div className="flex flex-col gap-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                {showFull && (
                  <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {group.title}
                  </p>
                )}
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          onClick={() => isMobileOpen && toggleMobileSidebar()}
                          className={`menu-item ${active ? 'menu-item-active' : 'menu-item-inactive'} ${!showFull ? 'justify-center px-0' : ''}`}
                        >
                          <Icon
                            className={`h-5 w-5 shrink-0 ${
                              active
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          />
                          {showFull && <span>{item.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Budget widget */}
        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          {showFull ? (
            <div
              onClick={() => setIsBudgetModalOpen(true)}
              className="group cursor-pointer rounded-xl bg-gray-900 p-3.5 text-white transition hover:bg-gray-850 hover:ring-1 hover:ring-emerald-500/50 dark:bg-gray-800 dark:hover:bg-gray-750"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsBudgetModalOpen(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[11px] font-medium text-gray-400">Monthly budget</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 transition group-hover:underline">
                  Adjust →
                </span>
              </div>

              <div className="mt-1.5 flex items-baseline">
                {isLoading ? (
                  <span className="inline-block h-6 w-20 animate-pulse rounded bg-gray-700"></span>
                ) : (
                  <p className="text-lg font-bold tracking-tight text-white">
                    ₹{new Intl.NumberFormat('en-IN').format(budget)}
                    <span className="text-xs font-normal text-gray-400"> / mo</span>
                  </p>
                )}
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                Click to adjust slider, steppers, or presets
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(true)}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-emerald-400 shadow-sm transition hover:bg-gray-800 hover:ring-1 hover:ring-emerald-500/50 dark:bg-gray-800 dark:hover:bg-gray-750"
              title={`Monthly budget: ₹${new Intl.NumberFormat('en-IN').format(budget)} / mo (Click to adjust)`}
            >
              ₹
            </button>
          )}
        </div>

        {/* Budget Modal */}
        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
        />
      </aside>
    </>
  );
}
