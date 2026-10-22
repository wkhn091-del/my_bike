import Link from "next/link";

/** A wheel rim around a single-line Galilee peak, with the sunset. Same drawing as src/app/icon.svg. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false" fill="none">
      <circle cx="16" cy="16" r="14.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.75" strokeDasharray="0.75 2.4" />
      <path d="M8 21.5 L13.25 13 L16.5 17.5 L19.25 14 L24 21.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20.5" cy="9.5" r="1.9" className="fill-sunset" />
    </svg>
  );
}

export function Logo({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const color = tone === "light" ? "text-cream" : "text-charcoal";
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 flex-row items-center gap-2 transition-colors duration-[var(--motion-base)] sm:min-h-12 sm:gap-2.5 ${color} ${className}`}
      aria-label="RideWithYoav, לדף הבית"
    >
      <LogoMark className="size-8 shrink-0 sm:size-9" />
      <bdi dir="ltr" className="flex items-baseline gap-[0.35em] text-[0.78rem] leading-none uppercase tracking-[0.18em] sm:gap-[0.4em] sm:text-[0.9rem] sm:tracking-[0.22em]">
        <span className="font-medium opacity-80 max-[380px]:hidden">Ride with</span>
        <span className="hidden font-medium opacity-80 max-[380px]:inline">Ride</span>
        <span className="font-black tracking-[0.14em] sm:tracking-[0.18em]">Yoav</span>
      </bdi>
    </Link>
  );
}
