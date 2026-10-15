import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { sanityPreview } from "@/lib/sanity/client";

export const runtime = "nodejs";

/** Entered only from the Sanity Studio Presentation tool, which signs the URL with a short-lived secret. */
export async function GET(request: Request) {
  if (!sanityPreview) return new Response("Preview is not configured", { status: 404 });

  const { isValid, redirectTo = "/" } = await validatePreviewUrl(sanityPreview, request.url);
  if (!isValid) return new Response("Invalid secret", { status: 401 });

  (await draftMode()).enable();
  redirect(redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/");
}
