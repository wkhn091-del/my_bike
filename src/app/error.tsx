"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="section">
      <div className="container-x max-w-xl text-center">
        <h1 className="text-h2">משהו השתבש אצלנו</h1>
        <p className="mt-3 text-lead">לא חויבתם על שום דבר בגלל התקלה. אפשר לנסות שוב.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            לנסות שוב
          </button>
          <Link href="/" className="btn-secondary">
            לדף הבית
          </Link>
        </div>
      </div>
    </main>
  );
}
