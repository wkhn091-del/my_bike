import "server-only";
import * as Sentry from "@sentry/nextjs";

/**
 * The only way server code reports a failure. Never pass buyer data (names, emails, phones) in
 * `tags`: they are indexed in Sentry and outlive the privacy policy's retention period.
 */
export function reportError(scope: string, error: unknown, tags: Record<string, string> = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}] ${message}`);
  Sentry.captureException(error, { tags: { scope, ...tags } });
}

const BLOCKED_REPORT_INTERVAL_MS = 60_000;
const lastBlockedReport = new Map<string, number>();

/** Expected rejections. At most one Sentry event per reason and action per minute per instance. */
export function reportBlocked(reason: "rate_limit" | "turnstile" | "origin", action: string): void {
  console.warn(`[blocked] ${reason} on ${action}`);
  const key = `${reason}:${action}`;
  const now = Date.now();
  if (now - (lastBlockedReport.get(key) ?? 0) < BLOCKED_REPORT_INTERVAL_MS) return;
  lastBlockedReport.set(key, now);
  Sentry.captureMessage(`blocked:${reason}`, { level: "warning", tags: { scope: "security", reason, action } });
}
