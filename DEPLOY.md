# Deploy: RideWithYoav

Two deployables:

| What | Where | From |
|---|---|---|
| The site (Next.js 16) | Vercel | repo root |
| Sanity Studio (Yoav edits content) | `*.sanity.studio` | `studio/` |

Order on first launch: **1 Neon → 2 Sanity → 3 Resend / Google / Turnstile / Upstash / Sentry → 4 Vercel env → 5 deploy → 6 Cardcom test purchase → 7 switch to live.**

---

## 1. Database: Neon Postgres

1. Create a Neon project in region **Frankfurt (eu-central-1)**, close to Vercel `fra1`.
2. Create two branches: `main` (Production) and `preview` (Preview). Preview never touches real orders.
3. Use the **pooled** connection string (`-pooler` host, `sslmode=require`).
4. Run the migrations once per branch:
   ```bash
   DATABASE_URL="postgresql://…main…" npm run db:migrate
   DATABASE_URL="postgresql://…preview…" npm run db:migrate
   ```
   `scripts/migrate.mjs` records each file in `schema_migrations`, so it is safe to re-run.
5. Neon role: the app role owns only this database. No superuser in the connection string.

Seat holds expire on their own (15 minutes, `hold_expires_at`), so no cron is needed.

## 2. Sanity

### Project and dataset
1. `sanity.io/manage` → new project → dataset `production`, **visibility: Private**.
   The dataset holds coupon codes; a public dataset would let anyone list them.
2. **API → Tokens**: create **two** tokens and never reuse one for both:
   - `site-read`: role **Viewer** → Vercel `SANITY_READ_TOKEN` (all environments).
   - Editing happens only by logged-in users in the Studio. The site has **no write token**.
     If a script ever needs one (e.g. a content import), create a temporary Editor token, use it locally, and delete it right away.
3. **API → CORS origins** (only these, with credentials **off** unless noted):
   - `https://ridewithyoav.sanity.studio` (credentials **on**, it is the Studio itself)
   - `http://localhost:3333` (credentials **on**, local Studio)
   - The site does **not** need a CORS entry: it reads Sanity from the server only.
4. **Members**: invite Yoav as **Editor**. Agency keeps **Administrator**.

### Studio
```bash
cd studio
cp .env.example .env    # SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_PREVIEW_URL=https://ridewithyoav.co.il
npm ci
npm run deploy          # first time asks for the hostname: ridewithyoav
```
After the first deploy, add the printed `appId` under `deployment` in `studio/sanity.cli.ts`.

Then create the two singletons once in the Studio: **פרטי העסק** and **יום הקהילה** (fill price, capacity and date before opening sales).

### Revalidate webhook (publish → site updates within seconds)
**API → Webhooks → Create**:
- URL: `https://ridewithyoav.co.il/api/revalidate`
- Dataset: `production`, Trigger on: Create, Update, Delete
- Filter: `_type in ["siteSettings","event","testimonial","galleryImage","faqItem"]`
- Projection: `{_type}`
- HTTP method: POST, API version: `v2025-02-19`
- **Secret**: the same value as Vercel `SANITY_REVALIDATE_SECRET` (`openssl rand -base64 32`)

Coupons are read live on every checkout, so they are deliberately not in the filter.

Create a second webhook for the Preview deployment only if you need instant updates there; otherwise preview content refreshes on the next deploy.

## 3. Services

| Service | Setup | Env |
|---|---|---|
| **Resend** | Add domain `ridewithyoav.co.il`, publish SPF + DKIM DNS records, add DMARC `p=quarantine`. Key with **Sending access** for that domain only. | `RESEND_API_KEY`, `MAIL_FROM`, `NOTIFY_EMAIL` |
| **Google Sheets** | Google Cloud → service account (no roles) → JSON key. Create the sheet with tabs `הזמנות`, `ליווי`, `המתנה`, share it with the service-account email as **Editor**. Enable the Sheets API. | `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY` (with `\n`), `GOOGLE_SHEET_ID` |
| **Cloudflare Turnstile** | Widget in **Managed** mode, hostnames: `ridewithyoav.co.il`, `www.ridewithyoav.co.il`, the Vercel preview domain. | `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| **Upstash Redis** | Region `eu-central-1`. One database for Production, a separate one for Preview. | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Sentry** | Next.js project, server-side only. Alerts: any `payment-*` or `cardcom-*` tag → email. | `SENTRY_DSN` |

## 4. Vercel

Project settings:
- Framework: Next.js, root directory: repo root, Node 24.
- Functions region: **fra1**.
- Deployment Protection: Vercel Authentication **on for Preview**.
- Domain: `ridewithyoav.co.il` (primary) + `www` redirect to it.

### Environment variables per environment

| Variable | Production | Preview | Development (local `.env.local`) |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://ridewithyoav.co.il` | preview URL | `http://localhost:3000` |
| `PAYMENTS_MODE` | `live` (enforced) | `test` (enforced) | `mock` or `test` |
| `CARDCOM_TERMINAL` / `CARDCOM_API_NAME` | Yoav's terminal | `1000` / `test2025` | `1000` / `test2025` |
| `DATABASE_URL` | Neon `main` | Neon `preview` | Neon `preview` or local |
| `SANITY_PROJECT_ID`, `SANITY_DATASET` | ✓ | ✓ | ✓ |
| `SANITY_READ_TOKEN` | Viewer token | Viewer token | Viewer token |
| `SANITY_REVALIDATE_SECRET` | own value | own value | optional |
| `SANITY_STUDIO_ORIGIN` | `https://ridewithyoav.sanity.studio` | same | `http://localhost:3333` |
| `TOKEN_SECRET` | own value (`openssl rand -base64 48`) | **different** value | optional (random per boot) |
| `CRON_SECRET` | own value (`openssl rand -base64 48`) | empty (crons run on Production only) | empty |
| `RESEND_API_KEY`, `MAIL_FROM`, `NOTIFY_EMAIL` | ✓ | ✓ (NOTIFY to agency) | optional |
| `GOOGLE_SA_*`, `GOOGLE_SHEET_ID` | real sheet | a test copy | optional |
| `UPSTASH_*` | prod DB | preview DB | optional (memory fallback) |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✓ | ✓ | Cloudflare test keys |
| `SENTRY_DSN` | ✓ | ✓ | empty |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | own value (`openssl rand -base64 32`) | own value | empty |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_ID` | ✓ | empty | empty |

The app refuses to boot if Production is missing a required value, if Production is not `live`, or if Preview is not `test` (`src/lib/env/server.ts`).
Mark every non-`NEXT_PUBLIC_` value as **Sensitive** in Vercel.

## 5. Cardcom

1. Before launch, on Preview (`PAYMENTS_MODE=test`): buy 1 ticket and then 3 tickets with a test card, cancel once, fail once.
   Check: the order becomes `paid` in Neon, the confirmation email arrives, the row reaches the sheet, and seats on the wall go up.
2. In Yoav's Cardcom dashboard: confirm the terminal issues **חשבונית מס/קבלה**, and note which payment methods are enabled (Bit, Apple Pay, Google Pay) so the copy can name them.
3. The webhook URL is sent per transaction (`/api/cardcom/webhook`); there is nothing to configure in the dashboard.
4. Switch Production to Yoav's terminal and `PAYMENTS_MODE=live`. Make one real 1-ticket purchase and refund it from the Cardcom dashboard.

## 6. Launch checks

```bash
npm ci
npm run typecheck && npm run lint && npm test
npm run test:e2e        # builds and runs against a local production server
```
- `https://securityheaders.com` → A or better, `https://observatory.mozilla.org` → A or better.
- `robots.txt` on Production allows `/` and blocks `/api/`, `/thank-you/`, `/consent/`, `/feedback/`; on Preview it blocks everything.
- Vercel → Settings → Cron Jobs lists `/api/cron/feedback` (daily 07:00 UTC). It emails paid orders once, from the day after the event for a week; a call without `CRON_SECRET` gets 401.
- Run `npm run db:migrate` after deploying (adds `feedback` and `coaching_leads.source`).
- Search Console: add the domain and submit `/sitemap.xml`.
- Opening sales: in the Studio, **יום הקהילה → מחיר ומכירה → ההרשמה פתוחה** → publish.

## 7. Rollback and incidents

- Bad deploy: Vercel → Deployments → previous → **Promote to Production**. DB migrations are additive only.
- A leaked secret: rotate it at the provider, update Vercel, redeploy. `TOKEN_SECRET` rotation invalidates outstanding thank-you and consent links: re-send them from the order list.
- Stop sales immediately: turn off **ההרשמה פתוחה** in the Studio (takes effect on publish).
