-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idDocRejectReason" TEXT,
ADD COLUMN     "idDocReviewedAt" TIMESTAMP(3),
ADD COLUMN     "idDocReviewedById" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';
