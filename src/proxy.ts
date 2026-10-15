import { NextResponse, type NextRequest } from "next/server";
import { buildReportingEndpoints, buildSiteCsp, createNonce, parseStudioOrigin } from "@/lib/security/csp";
import { SECURITY_HEADERS } from "@/lib/security/headers";

const studioOrigin = parseStudioOrigin(process.env.SANITY_STUDIO_ORIGIN);

export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildSiteCsp(nonce, process.env.NODE_ENV === "development", studioOrigin);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Reporting-Endpoints", buildReportingEndpoints());
  for (const header of SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2|gpx)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
