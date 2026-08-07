import { Loader2 } from 'lucide-react';

interface Props {
  label?: string;
  full?: boolean;
  className?: string;
}

export function Loading({ label = 'Memuat...', full = false, className = '' }: Props) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
  if (full) {
    return <div className="min-h-[60vh] grid place-items-center">{content}</div>;
  }
  return content;
}

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-xl ${className}`} />;
}
