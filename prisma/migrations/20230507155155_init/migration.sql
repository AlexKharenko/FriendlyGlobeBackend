-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';
