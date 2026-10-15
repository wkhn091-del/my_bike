const TZ = "Asia/Jerusalem";

/** The request goes out from the day after the event; a missed cron run catches up within this window. */
export const FEEDBACK_WINDOW_DAYS = 7;
/** How long the link in the email stays valid. */
export const FEEDBACK_LINK_DAYS = 30;

/** Today's date in Israel as YYYY-MM-DD. */
export function israelDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function dayNumber(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);
}

/** True from the day after the event (Israel time) until FEEDBACK_WINDOW_DAYS later. */
export function isFeedbackDue(eventDate: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return false;
  const daysAfter = dayNumber(israelDate(now)) - dayNumber(eventDate);
  return daysAfter >= 1 && daysAfter <= FEEDBACK_WINDOW_DAYS;
}
