import { db } from "@/lib/db";
import { requireStaff } from "@/lib/staff";
import { getT, formatDate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Audit() {
  await requireStaff("/admin/audit");
  const { t, locale } = await getT();
  const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const actors = await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.actorId))] } }, select: { id: true, name: true } });
  const name = new Map(actors.map((a) => [a.id, a.name]));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-extrabold">{t("admin.audit")}</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-muted">{formatDate(r.createdAt, locale)}</td>
                <td className="px-3 py-2">{name.get(r.actorId) ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {r.targetType}:{r.targetId.slice(-8)}
                </td>
                <td className="px-3 py-2">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-muted">—</p>}
      </div>
    </div>
  );
}
