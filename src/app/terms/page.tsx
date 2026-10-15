import type { Metadata } from "next";
import { BusinessLine, LegalPage } from "@/components/layout/LegalPage";
import { getSiteContent } from "@/lib/content/get";
import { formatLongDate, formatShortDate, inPlace } from "@/lib/format";

export const metadata: Metadata = { title: "תנאי השתתפות", alternates: { canonical: "/terms" } };

/** Used until Yoav publishes the lawyer-approved text in Sanity (siteSettings.healthDeclaration). */
const DEFAULT_HEALTH_DECLARATION = [
  "אני מצהיר/ה שמצב בריאותי מאפשר השתתפות ביום רכיבה מאומץ בשטח, ושאין לי מגבלה רפואית ידועה שמונעת זאת.",
  "אם יש לי מצב רפואי, אני מתחייב/ת להתייעץ עם רופא לפני האירוע ולעדכן את יואב מראש.",
  "אני מתחייב/ת לחבוש קסדה תקינה לאורך כל הרכיבה, להגיע עם אופניים תקינים, ולפעול לפי הנחיות המדריכים.",
];

export default async function TermsPage() {
  const { event, settings } = await getSiteContent();
  const health = settings.healthDeclaration ? settings.healthDeclaration.split(/\n{2,}/) : DEFAULT_HEALTH_DECLARATION;

  return (
    <LegalPage title="תנאי השתתפות" updated="14.10.2026">
      <p>
        התנאים חלים על ההרשמה ל{event.title}, שמתקיים ב<bdi>{formatLongDate(event.date)}</bdi> {inPlace(event.region)}. המארגן: <BusinessLine />.
      </p>

      <h2>הרשמה ותשלום</h2>
      <ul>
        <li>בכל הזמנה אפשר לרכוש עד 4 כרטיסים. כל המחירים כוללים מע״מ.</li>
        <li>המחיר נקבע בשרת ברגע התשלום. בכל הזמנה ניתנת הנחה אחת בלבד, ההנחה המשתלמת ביותר עבורכם.</li>
        <li>התשלום מתבצע בדף הסליקה המאובטח של Cardcom. פרטי האשראי לא נשמרים אצלנו. חשבונית מס/קבלה נשלחת למייל.</li>
        <li>המקום נשמר לכם ל-15 דקות מרגע המעבר לתשלום. אם התשלום לא הושלם, המקום משתחרר.</li>
      </ul>

      <h2>ביטול והעברת כרטיס</h2>
      <ul>
        <li>ביטול עד 14 יום לפני האירוע: החזר מלא.</li>
        <li>פחות מ-14 יום לפני האירוע: אין החזר, אבל אפשר להעביר את הכרטיס לחבר בלי עמלה. מעדכנים את יואב בוואטסאפ או במייל עם השם והטלפון של הרוכב החדש.</li>
        <li>
          לביטול: <bdi dir="ltr">{settings.email}</bdi> או וואטסאפ <bdi dir="ltr">{settings.phone}</bdi>.
        </li>
      </ul>

      <h2>מזג אוויר</h2>
      <p>
        אם יירד גשם, האירוע עובר ל{event.rainDate ? <bdi>{formatShortDate(event.rainDate)}</bdi> : "תאריך חלופי שיפורסם באתר ויישלח במייל"}. מי שלא יכול להגיע בתאריך
        החדש מקבל החזר מלא.
      </p>

      <h2>גיל</h2>
      <p>ההשתתפות מגיל 16. רוכבים מתחת לגיל 18 משתתפים רק עם אישור חתום של הורה או אפוטרופוס, שנשלח להורה בקישור אישי אחרי התשלום.</p>

      <h2>בטיחות ואחריות</h2>
      <ul>
        <li>רכיבה בשטח כרוכה בסיכון. כל משתתף/ת רוכב/ת לפי יכולתו/ה ובאחריותו/ה, ומתחייב/ת לפעול לפי הנחיות המדריכים.</li>
        <li>חבישת קסדה חובה. רוכב/ת בלי קסדה לא יוכל/תוכל לצאת למסלול.</li>
        <li>המארגן רשאי למנוע השתתפות ממי שמסכן/ת את עצמו/ה או אחרים.</li>
      </ul>

      <h2 id="health">הצהרת בריאות</h2>
      {health.map((paragraph) => (
        <p key={paragraph.slice(0, 24)}>{paragraph}</p>
      ))}

      <h2>צילום</h2>
      <p>לאורך היום מצלם צלם מקצועי. מי שלא רוצה להופיע בתמונות שיפורסמו, מוזמן/ת לעדכן את יואב לפני האירוע או ביום עצמו.</p>
    </LegalPage>
  );
}
