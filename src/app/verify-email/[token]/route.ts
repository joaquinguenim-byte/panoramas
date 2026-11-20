import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";
import { appUrl } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = await consumeToken(token, "verify_email");
  if (!userId) return NextResponse.redirect(appUrl("/verify-email?error=badToken"));
  const u = await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.redirect(appUrl(u.verifiedAt ? "/?emailVerified=1" : "/verify?emailVerified=1"));
}
