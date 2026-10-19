import Link from "next/link";
import type { ReactNode } from "react";

/** Required micro-notice under every PII form CTA (Israeli Privacy Protection Law). */
export function FormPrivacyNote({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <p className={`mt-2 text-center text-micro text-charcoal-soft ${className}`.trim()}>
      {children ?? (
        <>
          בלחיצה הפרטים נשמרים לפי{" "}
          <Link href="/privacy" className="link">
            מדיניות הפרטיות
          </Link>
          .
        </>
      )}
    </p>
  );
}
