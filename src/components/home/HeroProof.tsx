import type { CSSProperties } from "react";
import type { HeroProof as Proof } from "@/lib/content/proof";

const chipDark =
  "inline-flex max-w-full items-center gap-2 rounded-full border border-cream/25 bg-charcoal/55 px-3 py-1.5 text-[0.78rem] font-semibold text-cream backdrop-blur-sm sm:px-3.5 sm:text-micro";
const chipLight =
  "inline-flex max-w-full items-center gap-2 rounded-full border border-charcoal/12 bg-cream/80 px-3 py-1.5 text-[0.78rem] font-semibold text-charcoal shadow-contact backdrop-blur-sm sm:px-3.5 sm:text-micro";

function Star() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-sunset">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

/** The one trust signal above the fold (Script 2 module B rule 9). Always a real, checkable fact. */
export function HeroProof({ proof, tone = "dark" }: { proof: Proof; tone?: "dark" | "light" }) {
  const style = { "--d": "60ms" } as CSSProperties;
  const chip = tone === "light" ? chipLight : chipDark;
  const hover = tone === "light" ? "hover:border-olive/35" : "hover:border-cream/60";

  if (proof.kind === "google") {
    return (
      <a href={proof.href} target="_blank" rel="noopener noreferrer" className={`hero-in ${chip} ${hover}`} style={style}>
        <Star />
        <span>
          <bdi>{proof.rating.toFixed(1)}</bdi> ב-Google · <bdi>{proof.reviewCount.toLocaleString("he-IL")}</bdi> ביקורות
        </span>
        <span className="sr-only">(נפתח בחלון חדש)</span>
      </a>
    );
  }

  return (
    <p className={`hero-in ${chip}`} style={style}>
      <span className="size-1.5 rounded-full bg-sunset" aria-hidden="true" />
      {proof.kind === "pastEdition" ? (
        <span>
          במהדורה הקודמת רכבו <bdi>{proof.riders}</bdi> רוכבים{proof.soldOut ? " · כל המקומות נתפסו" : ""}
        </span>
      ) : proof.kind === "followers" ? (
        <span>
          <bdi>{proof.followers}</bdi> עוקבים באינסטגרם של יואב
        </span>
      ) : (
        <span>
          החזר מלא עד <bdi>{proof.refundDays}</bdi> יום לפני<span className="max-sm:hidden"> · מדריך שרוכב איתכם כל הדרך</span>
        </span>
      )}
    </p>
  );
}
