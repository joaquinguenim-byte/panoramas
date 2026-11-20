import { NextResponse } from "next/server";
import { runScheduledNotifications } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Called by Vercel Cron (see vercel.json) with "Authorization: Bearer $CRON_SECRET". */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json(await runScheduledNotifications());
}
