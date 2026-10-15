"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, background: "#F4EDE0", color: "#1F211C", fontFamily: "system-ui, Arial, sans-serif" }}>
        <main style={{ maxWidth: 480, margin: "0 auto", padding: "96px 20px", textAlign: "center", lineHeight: 1.7 }}>
          <h1 style={{ fontSize: 32 }}>משהו השתבש אצלנו</h1>
          <p style={{ fontSize: 18 }}>לא חויבתם על שום דבר בגלל התקלה. אפשר לנסות שוב.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, minHeight: 56, padding: "0 28px", borderRadius: 999, border: 0, background: "#E07A2E", color: "#1F211C", fontSize: 18, fontWeight: 700 }}
          >
            לנסות שוב
          </button>
        </main>
      </body>
    </html>
  );
}
