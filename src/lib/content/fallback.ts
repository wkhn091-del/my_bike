import type { SiteContent } from "./types";

/**
 * Used until Sanity is connected, and if it is unreachable. Only facts confirmed in
 * PROJECT_BRIEF.md. Anything still marked ❓ there is null here and its UI stays hidden.
 */
export const fallbackContent: SiteContent = {
  settings: {
    brand: "RideWithYoav",
    legalName: null,
    vatNumber: null,
    address: null,
    phone: "052-7841250",
    whatsapp: "972527841250",
    email: "info@ridewithyoav.co.il",
    answeringHours: null,
    accessibility: { name: "יואב לוי", phone: "052-7841250", email: "yoav@ridewithyoav.co.il" },
    instagramUrl: null,
    facebookUrl: null,
    stravaUrl: null,
    youtubeUrl: null,
    instagramFollowers: null,
    followersAsOf: null,
    coachingText: "אני מלווה רוכבים לאורך כל השנה: תוכנית אימונים אישית ומעקב.",
    coachingResponseDays: null,
    healthDeclaration: null,
    proof: { google: null, pastEdition: null, credentials: [] },
  },
  event: {
    title: "יום הקהילה",
    date: "2027-01-08",
    rainDate: null,
    region: "הגליל",
    meetingPoint: null,
    parking: null,
    priceAgorot: 69_000,
    capacity: 80,
    early: null,
    friendDiscountAgorot: null,
    salesOpen: true,
    schedule: [],
    included: ["ארוחות לאורך היום", "סדנאות מקצועיות", "צילום מקצועי לאורך היום", "הדרכה של יואב לאורך כל המסלול"],
    route: { km: null, elevationM: null, terrain: null, bikes: null, fitText: null, paceText: null, stravaUrl: null },
    photosDelivery: null,
    safety: null,
    heroImage: null,
    yoavImages: [],
  },
  testimonials: [],
  faq: [
    { question: "אני מתחיל. אני אעמוד בקצב?", answer: "המסלול בנוי לרוכבים מתחילים-בינוניים שכבר רוכבים באופן קבוע." },
    {
      question: "אני לא מכיר אף אחד. זה מוזר לבוא לבד?",
      answer: "רוב הקהילה מכירה את יואב מהאינסטגרם, והיום מתחיל בהיכרות.",
    },
    { question: "מה להביא?", answer: "קסדה היא חובה." },
    {
      question: "מה קורה אם יורד גשם?",
      answer: "אם יירד גשם, האירוע עובר לתאריך חלופי. מי שלא יכול להגיע בתאריך החדש מקבל החזר מלא.",
    },
    {
      question: "ואם אני צריך לבטל?",
      answer: "עד 14 יום לפני האירוע: החזר מלא. אחר כך אפשר להעביר את הכרטיס לחבר, בלי עמלה.",
    },
    { question: "אפשר להביא חבר?", answer: "כן. קונים עד 4 כרטיסים בהזמנה אחת." },
    { question: "מאיזה גיל אפשר להשתתף?", answer: "מגיל 16. מתחת ל-18 רק עם אישור וחתימת הורה." },
    { question: "מקבלים חשבונית?", answer: "כן, חשבונית מס/קבלה נשלחת למייל מיד אחרי התשלום." },
  ],
  gallery: [],
};
