-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';

-- CreateTable
CREATE TABLE "Chat" (
    "chatId" SERIAL NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("chatId")
);

-- CreateTable
CREATE TABLE "Message" (
    "messageId" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "timeCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited" BOOLEAN NOT NULL,
    "timeEdited" TIMESTAMP(3),
    "read" BOOLEAN NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("messageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_user1Id_user2Id_key" ON "Chat"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_timeCreated_idx" ON "Message"("timeCreated");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("chatId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
