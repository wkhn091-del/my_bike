"use client";

import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Loaded by our nonced bundle, so the CSP's 'strict-dynamic' admits it. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not initialise")));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type Props = {
  siteKey: string | null;
  action: "checkout" | "coaching" | "waitlist" | "feedback" | "details" | "consent";
  /** Changes after every server response: a token is single-use, so the widget must issue a new one. */
  resetSignal?: unknown;
};

/** Adds a hidden `cf-turnstile-response` input to the form. Most visitors never see it. */
export function TurnstileField({ siteKey, action, resetSignal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | undefined>(undefined);
  const firstSignal = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!siteKey || !container) return;
    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadTurnstile()
          .then((turnstile) => {
            if (cancelled) return;
            widgetRef.current = turnstile.render(container, {
              sitekey: siteKey,
              action,
              appearance: "interaction-only",
              theme: "light",
              language: "he",
              size: "flexible",
            });
          })
          .catch(() => {
            /* The server rejects the submission without a token and shows a retry message. */
          });
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (widgetRef.current) window.turnstile?.remove(widgetRef.current);
      widgetRef.current = undefined;
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (firstSignal.current) {
      firstSignal.current = false;
      return;
    }
    if (widgetRef.current) window.turnstile?.reset(widgetRef.current);
  }, [resetSignal]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}
