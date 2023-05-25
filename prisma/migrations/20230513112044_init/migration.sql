-- DropForeignKey
ALTER TABLE "BlackList" DROP CONSTRAINT "BlackList_blockedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "BlackList" DROP CONSTRAINT "BlackList_blockedUserId_fkey";

-- DropForeignKey
ALTER TABLE "BlockedUserMessage" DROP CONSTRAINT "BlockedUserMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserDetails" DROP CONSTRAINT "UserDetails_userId_fkey";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUserMessage" ADD CONSTRAINT "BlockedUserMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackList" ADD CONSTRAINT "BlackList_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackList" ADD CONSTRAINT "BlackList_blockedByUserId_fkey" FOREIGN KEY ("blockedByUserId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
