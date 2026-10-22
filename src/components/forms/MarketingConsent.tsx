import Link from "next/link";

/** Opt-in only (unchecked by default) — Israeli spam amendment + Privacy Protection Law. */
export function MarketingConsent({ className = "check text-small" }: { className?: string }) {
  return (
    <label className={className}>
      <input type="checkbox" name="marketing" />
      <span>
        אני מסכים/ה לקבל דיוור מ־RideWithYoav על אירועים והצעות (מייל / וואטסאפ / סמס). אפשר להסיר בכל הודעה.{" "}
        <Link href="/privacy" className="link">
          מדיניות הפרטיות
        </Link>
      </span>
    </label>
  );
}
