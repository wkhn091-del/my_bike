import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getSiteContent } from "@/lib/content/get";

export const metadata: Metadata = { title: "הצהרת נגישות", alternates: { canonical: "/accessibility" } };

export default async function AccessibilityPage() {
  const { settings } = await getSiteContent();
  const coordinator = settings.accessibility;
  return (
    <LegalPage title="הצהרת נגישות" updated="14.10.2026">
      <p>
        האתר נבנה כך שיתאים לתקן הישראלי 5568 ברמת AA, המבוסס על הנחיות WCAG 2.1. אנחנו רוצים שכל רוכב ורוכבת יוכלו להירשם בקלות, בלי קשר למגבלה.
      </p>

      <h2>מה עשינו</h2>
      <ul>
        <li>האתר עובד במלואו עם מקלדת, וכל רכיב מקבל מסגרת פוקוס ברורה.</li>
        <li>מבנה כותרות מסודר, תוויות לכל שדה בטופס, והודעות שגיאה שמוקראות לקוראי מסך.</li>
        <li>ניגודיות צבעים של 4.5:1 לפחות לטקסט, וגודל טקסט בסיסי של 18 פיקסלים.</li>
        <li>אפשר להגדיל את הטקסט עד 200% בלי לאבד תוכן.</li>
        <li>מי שביקש/ה ממערכת ההפעלה להפחית תנועה, יראה את האתר בלי אנימציות.</li>
        <li>לכל תמונה תוכנית יש טקסט חלופי.</li>
      </ul>

      <h2>נגישות האירוע</h2>
      <p>לשאלות על התאמות ביום האירוע עצמו, פנו לרכז הנגישות, ונבדוק יחד מה אפשר.</p>

      <h2>רכז הנגישות</h2>
      <p>
        {coordinator.name} · טלפון <bdi dir="ltr">{coordinator.phone}</bdi> · מייל <bdi dir="ltr">{coordinator.email}</bdi>
      </p>
      <p>מצאתם בעיה? נשמח לשמוע ולתקן. נחזור אליכם תוך 5 ימי עבודה.</p>
    </LegalPage>
  );
}
