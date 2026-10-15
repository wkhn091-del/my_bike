import { getSiteContent } from "@/lib/content/get";
import { siteUrl } from "@/lib/env/server";
import { inPlace } from "@/lib/format";

export const runtime = "nodejs";

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** All-day calendar entry for the event. Public data only. */
export async function GET() {
  const { event } = await getSiteContent();
  const start = event.date.replace(/-/g, "");
  const next = new Date(`${event.date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const location = [event.meetingPoint, event.region].filter(Boolean).join(", ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RideWithYoav//Community Day//HE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:community-day-${start}@ridewithyoav.co.il`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(`${event.title} · RideWithYoav`)}`,
    `LOCATION:${icsEscape(location)}`,
    `DESCRIPTION:${icsEscape(`יום רכיבה מודרך ${inPlace(event.region)}. כל הפרטים: ${siteUrl}`)}`,
    `URL:${siteUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="community-day.ics"',
    },
  });
}
