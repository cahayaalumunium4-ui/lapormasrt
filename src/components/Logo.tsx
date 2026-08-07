interface Props {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="12" fill="url(#lg)" />
      <path d="M14 22l10-8 10 8v12a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V22z" fill="#fff" />
      <path d="M21 26h6v10h-6z" fill="#16A34A" />
      <circle cx="24" cy="18" r="2.6" fill="#84CC16" stroke="#16A34A" strokeWidth="0.8" />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22C55E" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
