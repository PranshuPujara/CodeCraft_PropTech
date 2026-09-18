import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`} {...props} />;
}
