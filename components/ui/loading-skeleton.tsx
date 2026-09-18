export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return <div aria-label="Loading" className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}
