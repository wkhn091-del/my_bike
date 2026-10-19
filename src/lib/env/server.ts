import "server-only";
import { z } from "zod";

const secret = (min: number, max: number) => z.string().trim().min(min).max(max).optional();
const httpsUrl = z
  .url()
  .max(300)
  .refine((value) => value.startsWith("https://"), "Must be an https URL");

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    NEXT_PUBLIC_SITE_URL: z.url().max(200).default("http://localhost:3000"),

    /** live = real Cardcom terminal; test = Cardcom sandbox terminal; mock = no Cardcom, local only. */
    PAYMENTS_MODE: z.enum(["live", "test", "mock"]).default("mock"),
    CARDCOM_TERMINAL: z.coerce.number().int().positive().optional(),
    CARDCOM_API_NAME: secret(1, 100),

    DATABASE_URL: z
      .string()
      .trim()
      .max(500)
      .refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), "Must be a Postgres URL")
      .refine((value) => {
        try {
          const host = new URL(value).hostname;
          if (host === "localhost" || host === "127.0.0.1") return true;
        } catch {
          return false;
        }
        return /(?:^|[?&])sslmode=(require|verify-full|verify-ca)(?:&|$)/i.test(value);
      }, "Non-local DATABASE_URL must include sslmode=require (or verify-full / verify-ca)")
      .optional(),

    SANITY_PROJECT_ID: z.string().trim().regex(/^[a-z0-9-]{1,40}$/).optional(),
    SANITY_DATASET: z.string().trim().regex(/^[a-z0-9_-]{1,64}$/).default("production"),
    SANITY_API_VERSION: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).default("2026-10-01"),
    /** Viewer token: the dataset is private, so every read uses it. Never a write token. */
    SANITY_READ_TOKEN: secret(20, 500),
    SANITY_REVALIDATE_SECRET: secret(32, 200),
    SANITY_STUDIO_ORIGIN: z.url().max(200).optional(),

    /** Signs thank-you and parent-consent links. openssl rand -base64 48 */
    TOKEN_SECRET: secret(32, 200),
    /** Vercel Cron sends it as a Bearer token. Without it the cron routes refuse every call. */
    CRON_SECRET: secret(32, 200),

    RESEND_API_KEY: secret(10, 256),
    MAIL_FROM: z.string().trim().max(120).default("RideWithYoav <info@ridewithyoav.co.il>"),
    NOTIFY_EMAIL: z.email().max(120).optional(),

    GOOGLE_SA_EMAIL: z.email().max(200).optional(),
    GOOGLE_SA_PRIVATE_KEY: secret(100, 4000),
    GOOGLE_SHEET_ID: z.string().trim().regex(/^[A-Za-z0-9_-]{20,100}$/).optional(),

    UPSTASH_REDIS_REST_URL: httpsUrl.optional(),
    UPSTASH_REDIS_REST_TOKEN: secret(10, 512),
    TURNSTILE_SECRET_KEY: secret(10, 256),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: secret(10, 128),

    SENTRY_DSN: httpsUrl.optional(),
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: z
      .string()
      .trim()
      .refine((value) => {
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
        return [16, 24, 32].includes(atob(value).length);
      }, "Must be a base64 AES key of 16, 24 or 32 bytes (openssl rand -base64 32)")
      .optional(),
  })
  .superRefine((env, ctx) => {
    const pairs: Array<[keyof typeof env, keyof typeof env]> = [
      ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      ["TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
      ["GOOGLE_SA_EMAIL", "GOOGLE_SA_PRIVATE_KEY"],
      ["CARDCOM_TERMINAL", "CARDCOM_API_NAME"],
      ["SANITY_PROJECT_ID", "SANITY_READ_TOKEN"],
    ];
    for (const [a, b] of pairs) {
      if (Boolean(env[a]) !== Boolean(env[b])) {
        ctx.addIssue({ code: "custom", path: [a], message: `${a} and ${b} must be set together.` });
      }
    }
    if (env.PAYMENTS_MODE !== "mock" && !env.CARDCOM_TERMINAL) {
      ctx.addIssue({ code: "custom", path: ["CARDCOM_TERMINAL"], message: "Required when PAYMENTS_MODE is live or test." });
    }
    /**
     * Full production (real charges) requires live payments + every secret.
     * Public demo / portfolio deploys may set DEMO_PUBLIC=1 with PAYMENTS_MODE=mock
     * so the marketing site can ship without Neon/Sanity/Cardcom wired yet.
     */
    const demoPublic = process.env.DEMO_PUBLIC === "1";
    // Demo deploys are marketing-only: never attach a DB (mock checkout would mint free "paid" seats).
    if (demoPublic && env.DATABASE_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "DEMO_PUBLIC=1 forbids DATABASE_URL (no persisted mock orders).",
      });
    }
    if (env.VERCEL_ENV === "production" && !demoPublic) {
      if (env.PAYMENTS_MODE !== "live") {
        ctx.addIssue({ code: "custom", path: ["PAYMENTS_MODE"], message: "Production must use PAYMENTS_MODE=live." });
      }
      const required = [
        "DATABASE_URL",
        "SANITY_PROJECT_ID",
        "SANITY_REVALIDATE_SECRET",
        "TOKEN_SECRET",
        "CRON_SECRET",
        "RESEND_API_KEY",
        "NOTIFY_EMAIL",
        "UPSTASH_REDIS_REST_URL",
        "TURNSTILE_SECRET_KEY",
        "SENTRY_DSN",
        "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
      ] as const;
      for (const key of required) {
        if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "Required in production." });
      }
    }
    if (env.VERCEL_ENV === "production" && demoPublic && env.PAYMENTS_MODE !== "mock") {
      ctx.addIssue({
        code: "custom",
        path: ["PAYMENTS_MODE"],
        message: "DEMO_PUBLIC=1 requires PAYMENTS_MODE=mock (no real charges).",
      });
    }
    if (env.VERCEL_ENV === "preview" && env.PAYMENTS_MODE !== "test") {
      ctx.addIssue({ code: "custom", path: ["PAYMENTS_MODE"], message: "Preview deployments must use PAYMENTS_MODE=test (no real charges, no free mock orders)." });
    }
    if (env.VERCEL_ENV === "preview" && !env.TURNSTILE_SECRET_KEY) {
      ctx.addIssue({ code: "custom", path: ["TURNSTILE_SECRET_KEY"], message: "Required on preview (bot protection)." });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function readEnv(): Record<string, string | undefined> {
  const raw: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(process.env)) raw[key] = value === "" ? undefined : value;
  return raw;
}

function parseServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(readEnv());
  if (!result.success) {
    const details = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid server environment variables:\n${details}`);
  }
  return result.data;
}

export const serverEnv: ServerEnv = parseServerEnv();

export const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");

/** Local development without a token secret gets a per-boot key: links break on restart, which is fine locally. */
export const tokenSecret: string = serverEnv.TOKEN_SECRET ?? crypto.randomUUID() + crypto.randomUUID();
