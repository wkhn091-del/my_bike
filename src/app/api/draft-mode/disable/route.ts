import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export async function GET() {
  (await draftMode()).disable();
  redirect("/");
}
