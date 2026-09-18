export function Disclaimer({ text, className = '' }: { text?: string; className?: string }) {
  return (
    <p className={`rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300 ${className}`}>
      {text || 'Informational only, not legal advice. This analysis explains what the agreement states; it does not assess enforceability or predict legal outcomes.'}
    </p>
  );
}

