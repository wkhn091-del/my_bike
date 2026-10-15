import type { CSSProperties, ReactNode } from "react";

/** Endless strip, pure CSS (works as a Server Component). Reduced motion: a still, swipeable row. */
export function Marquee({ children, duration = 30, gap = "3rem", className = "" }: { children: ReactNode; duration?: number; gap?: string; className?: string }) {
  return (
    <div className={`mk-marquee ${className}`} style={{ "--mk-duration": `${duration}s`, "--mk-gap": gap } as CSSProperties}>
      <div className="mk-marquee__track">
        <div className="mk-marquee__group">{children}</div>
        {/* The copy exists only to make the loop seamless: hidden from screen readers and keyboard. */}
        <div className="mk-marquee__group" aria-hidden="true" inert>
          {children}
        </div>
      </div>
    </div>
  );
}
