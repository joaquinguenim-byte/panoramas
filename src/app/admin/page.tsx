import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/staff";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Admin() {
  await requireStaff("/admin");
  const { t } = await getT();
  const [pending, openUser, openEvent] = await Promise.all([
    db.user.count({ where: { idDocStatus: "pending_review" } }),
    db.userReport.count({ where: { status: "open" } }),
    db.report.groupBy({ by: ["eventId"], where: { status: "open" } }).then((g) => g.length),
  ]);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-extrabold">{t("admin.title")}</h1>
      <Link href="/admin/verifications" className="card block hover:shadow">
        <span className="font-bold">{t("admin.verifications")}</span>
        <span className="ml-2 chip">{t("admin.pendingCount", { n: pending })}</span>
      </Link>
      <Link href="/admin/reports" className="card block hover:shadow">
        <span className="font-bold">{t("admin.reports")}</span>
        <span className="ml-2 chip">{t("admin.pendingCount", { n: openUser + openEvent })}</span>
      </Link>
      <Link href="/admin/audit" className="card block hover:shadow">
        <span className="font-bold">{t("admin.audit")}</span>
      </Link>
    </div>
  );
}
