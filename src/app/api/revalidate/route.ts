import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";
import { reportBlocked } from "@/lib/observability/report";
import { CONTENT_TAG } from "@/lib/sanity/client";

export const runtime = "nodejs";

/** Called by a Sanity GROQ webhook on every publish. Signed with SANITY_REVALIDATE_SECRET. */
export async function POST(request: Request) {
  const secret = serverEnv.SANITY_REVALIDATE_SECRET;
  if (!secret) return new NextResponse(null, { status: 404 });

  const body = await request.text();
  if (body.length > 65_536) return new NextResponse(null, { status: 413 });
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? "";

  if (!signature || !(await isValidSignature(body, signature, secret))) {
    reportBlocked("origin", "revalidate");
    return new NextResponse(null, { status: 401 });
  }

  revalidateTag(CONTENT_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
