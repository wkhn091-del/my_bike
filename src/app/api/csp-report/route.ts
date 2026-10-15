import { NextResponse } from "next/server";
import { hashKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 8_192;
const WINDOW_MS = 10 * 60_000;

type CspReportBody = {
  "csp-report"?: { "violated-directive"?: string; "effective-directive"?: string; "blocked-uri"?: string };
  type?: string;
  body?: { effectiveDirective?: string; blockedURL?: string };
};

/** Report fields are attacker-controlled: strip control chars so they cannot forge log lines. */
function clean(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 80);
}

function hostOnly(value: string | undefined): string {
  if (!value || value === "inline" || value === "eval" || value === "self") return value ?? "";
  try {
    return new URL(value).host || value.slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
}

/** Browser CSP violation reports. No PII: directive + blocked host only. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`csp:ip:${await hashKey(ip)}`, 30, WINDOW_MS))) return new NextResponse(null, { status: 204 });

  const raw = await request.arrayBuffer();
  if (raw.byteLength === 0 || raw.byteLength > MAX_BYTES) return new NextResponse(null, { status: 204 });

  try {
    const json = JSON.parse(new TextDecoder().decode(raw)) as CspReportBody | CspReportBody[];
    const report = Array.isArray(json) ? json[0] : json;
    const legacy = report?.["csp-report"];
    const modern = report?.body;
    const directive = legacy?.["effective-directive"] || legacy?.["violated-directive"] || modern?.effectiveDirective || report?.type || "unknown";
    const blocked = hostOnly(legacy?.["blocked-uri"] || modern?.blockedURL);
    console.warn(`[csp] ${clean(directive)} blocked ${clean(blocked) || "(empty)"}`);
  } catch {
    /* ignore malformed reports */
  }
  return new NextResponse(null, { status: 204 });
}
