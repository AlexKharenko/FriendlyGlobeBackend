/*
  Warnings:

  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Message" DROP CONSTRAINT "Message_pkey",
ALTER COLUMN "messageId" DROP DEFAULT,
ALTER COLUMN "messageId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("messageId");
DROP SEQUENCE "Message_messageId_seq";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';
