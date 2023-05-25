-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';

-- CreateTable
CREATE TABLE "BlackList" (
    "blockedUserId" INTEGER NOT NULL,
    "blockedByUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackList_pkey" PRIMARY KEY ("blockedUserId","blockedByUserId")
);

-- AddForeignKey
ALTER TABLE "BlackList" ADD CONSTRAINT "BlackList_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackList" ADD CONSTRAINT "BlackList_blockedByUserId_fkey" FOREIGN KEY ("blockedByUserId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
