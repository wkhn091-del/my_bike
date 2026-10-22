/** Shared security headers for proxy + next.config (defense in depth). */
export const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Browsers that support CSP frame-ancestors ignore this; it only covers legacy ones.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** Lock-down CSP for JSON/API routes (proxy matcher skips /api, so next.config must cover them). */
export const API_CSP_HEADER = {
  key: "Content-Security-Policy",
  value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
} as const;
