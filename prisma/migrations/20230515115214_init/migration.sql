-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatId_fkey";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;
