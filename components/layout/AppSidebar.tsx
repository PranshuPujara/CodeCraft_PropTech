'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useSidebar } from '@/context/SidebarContext';
import { useUser } from '@/context/UserContext';
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
  const { budget, updateBudget, isLoading } = useUser();
  const pathname = usePathname();
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetValue, setEditBudgetValue] = useState(budget.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const showFull = isExpanded || isHovered || isMobileOpen;

  useEffect(() => {
    setEditBudgetValue(budget.toString());
  }, [budget]);

  useEffect(() => {
    if (isEditingBudget && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingBudget]);

  const handleBudgetSave = () => {
    const val = Number(editBudgetValue);
    if (!isNaN(val) && val > 0 && val <= 1000000) {
      updateBudget(val);
    } else {
      setEditBudgetValue(budget.toString());
    }
    setIsEditingBudget(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBudgetSave();
    } else if (e.key === 'Escape') {
      setEditBudgetValue(budget.toString());
      setIsEditingBudget(false);
    }
  };

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
        {showFull && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <div className="rounded-xl bg-gray-900 p-4 text-white dark:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-300">Your monthly budget</p>
                {!isEditingBudget && (
                  <button 
                    onClick={() => setIsEditingBudget(true)}
                    className="text-xs text-gray-400 hover:text-emerald-400 transition"
                    title="Edit budget"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              <div className="mt-1.5 flex items-baseline">
                {isEditingBudget ? (
                  <div className="flex items-center gap-1 w-full relative">
                    <span className="text-xl font-bold text-emerald-400 absolute left-0">₹</span>
                    <input
                      ref={inputRef}
                      type="number"
                      value={editBudgetValue}
                      onChange={(e) => setEditBudgetValue(e.target.value)}
                      onBlur={handleBudgetSave}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-1 pl-4 py-0.5 text-lg font-bold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      min="1"
                      max="1000000"
                    />
                  </div>
                ) : (
                  <p className="text-xl font-bold cursor-pointer group" onClick={() => setIsEditingBudget(true)}>
                    {isLoading ? (
                      <span className="inline-block h-6 w-20 animate-pulse bg-gray-700 rounded"></span>
                    ) : (
                      <>
                        ₹{new Intl.NumberFormat('en-IN').format(budget)}
                        <span className="text-sm font-medium text-gray-400"> / mo</span>
                      </>
                    )}
                  </p>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-gray-400">
                Costs are compared against this number.
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
