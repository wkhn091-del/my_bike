import { NextResponse } from "next/server";
import { confirmFromCardcom } from "@/lib/checkout/service";
import { getOrderByLowProfileId } from "@/lib/db/orders";
import { reportError } from "@/lib/observability/report";
import { LOW_PROFILE_ID } from "@/lib/payments/cardcom";
import { hashKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 32_768;

/** Cardcom may post JSON or a form; only the LowProfileId is read, everything else comes from GetLpResult. */
function extractLowProfileId(raw: string, contentType: string, url: URL): string | null {
  const candidates: unknown[] = [url.searchParams.get("lowprofilecode"), url.searchParams.get("LowProfileId")];
  try {
    if (contentType.includes("application/json")) {
      const json = JSON.parse(raw) as Record<string, unknown>;
      candidates.unshift(json.LowProfileId, json.lowProfileId);
    } else {
      const form = new URLSearchParams(raw);
      candidates.unshift(form.get("LowProfileId"), form.get("lowprofilecode"));
    }
  } catch {
    /* malformed body: fall back to the query string */
  }
  const id = candidates.find((value): value is string => typeof value === "string" && LOW_PROFILE_ID.test(value));
  return id ?? null;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`webhook:ip:${await hashKey(ip)}`, 30, 60_000))) {
    return new NextResponse(null, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return new NextResponse(null, { status: 413 });

  const lowProfileId = extractLowProfileId(raw, request.headers.get("content-type") ?? "", new URL(request.url));
  if (!lowProfileId) return NextResponse.json({ ok: true });

  // Only call Cardcom for LowProfileIds we issued — blocks credential/API abuse via random UUIDs.
  const known = await getOrderByLowProfileId(lowProfileId);
  if (!known) return NextResponse.json({ ok: true });

  try {
    await confirmFromCardcom(lowProfileId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // A non-200 makes Cardcom retry (up to 7 times), which is what we want for transient failures.
    reportError("cardcom-webhook", error);
    return new NextResponse(null, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
}
