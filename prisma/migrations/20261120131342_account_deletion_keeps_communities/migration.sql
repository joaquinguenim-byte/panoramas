-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_createdById_fkey";

-- AlterTable
ALTER TABLE "Community" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
