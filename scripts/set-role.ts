// Usage: npx tsx scripts/set-role.ts someone@example.com admin|moderator|user
import { PrismaClient } from "@prisma/client";

const [email, role] = process.argv.slice(2);
if (!email || !["admin", "moderator", "user"].includes(role)) {
  console.error("Usage: npx tsx scripts/set-role.ts <email> <admin|moderator|user>");
  process.exit(1);
}
const db = new PrismaClient();
db.user
  .update({ where: { email: email.toLowerCase() }, data: { role } })
  .then((u) => console.log(`${u.email} is now ${u.role}`))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
