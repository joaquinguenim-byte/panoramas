import { db } from "@/lib/db";
import { MIME, readIdDoc } from "@/lib/idDocs";
import { staffOrNull } from "@/lib/staff";

export const dynamic = "force-dynamic";

/** Streams a decrypted ID document to staff only. Never cached. */
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const staff = await staffOrNull();
  if (!staff) return new Response("Not found", { status: 404 });
  const { userId } = await params;
  const user = await db.user.findUnique({ where: { id: userId }, select: { idDocPath: true } });
  if (!user?.idDocPath) return new Response("Not found", { status: 404 });
  const doc = await readIdDoc(user.idDocPath).catch(() => null);
  if (!doc) return new Response("Document unavailable", { status: 410 });
  return new Response(new Uint8Array(doc.data), {
    headers: {
      "Content-Type": MIME[doc.type],
      "Content-Disposition": `inline; filename="id-${userId}.${doc.type}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
