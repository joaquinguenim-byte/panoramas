import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/staff";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Admin() {
  await requireStaff("/admin");
  const { t } = await getT();
  const pending = await db.user.count({ where: { idDocStatus: "pending_review" } });
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-extrabold">{t("admin.title")}</h1>
      <Link href="/admin/verifications" className="card block hover:shadow">
        <span className="font-bold">{t("admin.verifications")}</span>
        <span className="ml-2 chip">{t("admin.pendingCount", { n: pending })}</span>
      </Link>
    </div>
  );
}
