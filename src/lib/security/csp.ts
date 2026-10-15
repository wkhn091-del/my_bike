type Directives = Record<string, readonly string[]>;

/** Only the analytics tools approved in PROJECT_BRIEF §18. Add a host here only when it ships. */
const ANALYTICS_CONNECT = [
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://www.googletagmanager.com",
  "https://www.facebook.com",
  "https://connect.facebook.net",
  "https://*.clarity.ms",
] as const;

const ANALYTICS_IMG = [
  "https://www.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://www.facebook.com",
  "https://*.clarity.ms",
  "https://c.bing.com",
] as const;

const TURNSTILE = "https://challenges.cloudflare.com";
const SANITY_CDN = "https://cdn.sanity.io";
const CSP_REPORT_GROUP = "csp";

function serialize(directives: Directives): string {
  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

/**
 * `studioOrigin` is the Sanity Studio that may frame the site in its Presentation tool.
 * Nobody else may frame it (clickjacking on the checkout).
 */
export function buildSiteCsp(nonce: string, isDev: boolean, studioOrigin?: string): string {
  return serialize({
    "default-src": ["'self'"],
    // 'strict-dynamic' lets our nonced bundle inject gtag, the Meta pixel and Clarity after consent.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "https:",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", `'nonce-${nonce}'`],
    // React style props and GSAP write inline style attributes, which a nonce cannot cover.
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", SANITY_CDN, ...ANALYTICS_IMG],
    "font-src": ["'self'"],
    // `blob:` lets GLTFLoader read textures embedded in local models. It never opens remote hosts.
    "connect-src": ["'self'", "blob:", TURNSTILE, ...ANALYTICS_CONNECT, ...(isDev ? ["ws:"] : [])],
    "frame-src": [TURNSTILE],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // The checkout leaves through a server redirect to Cardcom, never through a form post.
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'", ...(studioOrigin ? [studioOrigin] : [])],
    "report-uri": ["/api/csp-report"],
    "report-to": [CSP_REPORT_GROUP],
    ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
  });
}

export function buildReportingEndpoints(): string {
  return `${CSP_REPORT_GROUP}="/api/csp-report"`;
}

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Accepts only a bare https origin, so a bad env value cannot inject extra CSP directives. */
export function parseStudioOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}
