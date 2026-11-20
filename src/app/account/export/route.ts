import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Everything we hold about the signed-in person, as JSON (right of access / portability). */
export async function GET() {
  const me = await currentUser();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });
  const data = await db.user.findUnique({
    where: { id: me.id },
    include: {
      hostedEvents: true,
      participations: { include: { event: { select: { id: true, title: true, startsAt: true, comuna: true } } } },
      messages: { select: { eventId: true, body: true, createdAt: true } },
      reports: { select: { eventId: true, reason: true, createdAt: true } },
      reportsMade: { select: { reportedId: true, reason: true, details: true, createdAt: true } },
      blocking: { select: { blockedId: true, createdAt: true } },
      memberships: { include: { community: { select: { name: true, slug: true } } } },
    },
  });
  if (!data) return new NextResponse("Not found", { status: 404 });
  const { passwordHash: _pw, idDocPath: _doc, ...rest } = data;
  void _pw;
  void _doc;
  return new NextResponse(JSON.stringify({ exportedAt: new Date(), ...rest }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="panoramas-mis-datos.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
