import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Importing the env module here validates every server variable once, when the server boots.
  const { serverEnv } = await import("@/lib/env/server");

  Sentry.init({
    dsn: serverEnv.SENTRY_DSN,
    enabled: Boolean(serverEnv.SENTRY_DSN),
    environment: serverEnv.VERCEL_ENV ?? serverEnv.NODE_ENV,
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.headers;
        delete event.request.query_string;
      }
      delete event.user;
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
