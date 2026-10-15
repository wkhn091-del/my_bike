const TZ = "Asia/Jerusalem";

/** "690 ₪" — whole shekels unless there are agorot. */
export function formatShekels(agorot: number): string {
  const value = agorot / 100;
  const text = new Intl.NumberFormat("he-IL", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${text} ₪`;
}

/** "בגליל", not "בהגליל": the prefix ב absorbs the definite article. */
export function inPlace(place: string): string {
  return `ב${place.replace(/^ה(?=[\u05D0-\u05EA]{2})/, "")}`;
}

function dateAtNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00+02:00`);
}

/** "יום שישי, 8 בינואר 2027" */
export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(
    dateAtNoon(isoDate),
  );
}

/** "8 בינואר" */
export function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", timeZone: TZ }).format(dateAtNoon(isoDate));
}

/** "8.1" */
export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day}.${month}`;
}

/** "יום שישי" */
export function formatWeekday(isoDate: string): string {
  return new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: TZ }).format(dateAtNoon(isoDate));
}

/** Whole years between a YYYY-MM-DD birth date and a YYYY-MM-DD event date. */
export function ageOn(birthDate: string, onDate: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [y, m, d] = onDate.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string);
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export const RIDING_LEVEL_LABEL = { beginner: "מתחיל", intermediate: "בינוני", advanced: "מתקדם" } as const;
