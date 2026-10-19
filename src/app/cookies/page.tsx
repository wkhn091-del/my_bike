import type { Metadata } from "next";
import { CookieChoiceReset } from "@/components/cookies/CookieChoiceReset";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "מדיניות עוגיות", alternates: { canonical: "/cookies" } };

const ROWS = [
  ["הכרחיות", "rwy_consent_v1 (אחסון מקומי)", "זוכר אם אישרתם או סירבתם לעוגיות", "עד שתמחקו"],
  ["הכרחיות", "Cloudflare Turnstile", "בדיקה שהטופס נשלח על ידי אדם ולא בוט", "זמן קצר"],
  ["מדידה (רק באישור)", "Google Analytics: _ga, _ga_*", "כמה מבקרים, מאיפה הגיעו, מה עובד באתר", "עד 13 חודשים"],
  ["מדידה (רק באישור)", "Microsoft Clarity: _clck, _clsk", "מפות חום והקלטות גלילה, בלי הקלדות", "עד שנה"],
  ["פרסום (רק באישור מלא)", "Meta Pixel: _fbp", "מדידת קמפיינים באינסטגרם ובפייסבוק", "עד 3 חודשים"],
] as const;

export default function CookiesPage() {
  return (
    <LegalPage title="מדיניות עוגיות" updated="19.10.2026">
      <p>
        עוגיות הן קבצים קטנים שהדפדפן שומר. באתר יש רק עוגיות הכרחיות, אלא אם אישרתם גם מדידה ו/או פרסום בבאנר. סירוב לא משנה שום דבר בהרשמה או בתשלום.
      </p>
      <h2>אילו עוגיות</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-start text-small">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 text-start">סוג</th>
              <th className="py-2 text-start">שם</th>
              <th className="py-2 text-start">למה</th>
              <th className="py-2 text-start">כמה זמן</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([kind, name, why, how]) => (
              <tr key={name} className="border-b border-line align-top">
                <td className="py-2">{kind}</td>
                <td className="py-2">
                  <bdi dir="ltr">{name}</bdi>
                </td>
                <td className="py-2">{why}</td>
                <td className="py-2">{how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>איך משנים את הבחירה</h2>
      <p>אפשר לאפס את הבחירה כאן — הבאנר יופיע שוב אחרי רענון העמוד. אפשר גם למחוק את נתוני האתר בהגדרות הדפדפן.</p>
      <CookieChoiceReset />
    </LegalPage>
  );
}
