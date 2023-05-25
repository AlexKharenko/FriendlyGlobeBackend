-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "edited" SET DEFAULT false,
ALTER COLUMN "read" SET DEFAULT false;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';
