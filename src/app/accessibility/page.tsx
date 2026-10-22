import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getSiteContent } from "@/lib/content/get";

export const metadata: Metadata = { title: "הצהרת נגישות", alternates: { canonical: "/accessibility" } };

export default async function AccessibilityPage() {
  const { settings } = await getSiteContent();
  const coordinator = settings.accessibility;
  return (
    <LegalPage title="הצהרת נגישות" updated="19.10.2026">
      <p>
        האתר נבנה מתוך כוונה לעמוד בתקן הישראלי 5568 ברמת AA (בהתבסס על WCAG 2.1). אנחנו ממשיכים לשפר נגישות, ורוצים שכל רוכב ורוכבת יוכלו להירשם בקלות.
      </p>

      <h2>מה עשינו</h2>
      <ul>
        <li>ניווט מקלדת, קישור &quot;דלג לתוכן&quot;, ומסגרת פוקוס ברורה לרכיבים אינטראקטיביים.</li>
        <li>תוויות לשדות טופס, קישור שגיאות ל־aria-describedby, והודעות שגיאה עם role=&quot;alert&quot;.</li>
        <li>יעד ניגודיות של לפחות 4.5:1 לטקסט רגיל; טקסט מושתק על רקע כהה מכוון ל־≈80% אטימות ומעלה.</li>
        <li>אפשר להגדיל את הטקסט עד 200% בלי לאבד תוכן משמעותי.</li>
        <li>מי שביקש/ה ממערכת ההפעלה להפחית תנועה, יראה פחות אנימציות (GSAP / סצנת תלת־ממד).</li>
        <li>תמונות תוכן עם טקסט חלופי; תמונות דקורטיביות מסומנות ככאלה.</li>
      </ul>

      <h2>מגבלות ידועות</h2>
      <ul>
        <li>רכיבי גלילה מונפשים (מפת היום, שער טיפוגרפי) עלולים להרגיש ארוכים במקלדת — אפשר לדלג עם טאבים או קישורי ניווט.</li>
        <li>Cloudflare Turnstile הוא רכיב צד־שלישי שעשוי לקחת פוקוס לרגע בבדיקת בוט.</li>
        <li>מספר עוסק וכתובת עסק מלאים מופיעים כשממלאים אותם ב־Studio; בינתיים מוצגים שם העסק ופרטי קשר.</li>
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
