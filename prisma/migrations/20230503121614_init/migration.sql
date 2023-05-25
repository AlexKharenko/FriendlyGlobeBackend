/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "RefreshToken" (
    "userId" INTEGER NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "dateExpired" TIMESTAMP(3) NOT NULL DEFAULT NOW() + interval '30 day'
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_userId_key" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
