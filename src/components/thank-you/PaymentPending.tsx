"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL_MS = 3000;
const MAX_TRIES = 20;

/** Cardcom's webhook can land a few seconds after the buyer returns. Re-check for about a minute. */
export function PaymentPending({ whatsapp }: { whatsapp: string }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= MAX_TRIES) return;
    const timer = window.setTimeout(() => {
      router.refresh();
      setTries((value) => value + 1);
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [tries, router]);

  return (
    <div role="status" className="text-center">
      <h1 className="text-h2">מאשרים את התשלום...</h1>
      {tries < MAX_TRIES ? (
        <p className="mt-3 text-lead">זה לוקח כמה שניות. אין צורך לרענן.</p>
      ) : (
        <p className="mt-3 text-lead">
          האישור מתעכב. אם חויבתם, המקום שלכם שמור והאישור יגיע במייל. שאלות?{" "}
          <a className="link" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
            כתבו ליואב בוואטסאפ
            <span className="sr-only"> (נפתח בחלון חדש)</span>
          </a>
        </p>
      )}
    </div>
  );
}
