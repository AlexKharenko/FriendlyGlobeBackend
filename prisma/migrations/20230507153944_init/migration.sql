-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';

-- CreateTable
CREATE TABLE "BlockedUserMessage" (
    "userId" INTEGER NOT NULL,
    "blockMessage" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedUserMessage_userId_key" ON "BlockedUserMessage"("userId");

-- AddForeignKey
ALTER TABLE "BlockedUserMessage" ADD CONSTRAINT "BlockedUserMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
