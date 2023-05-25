/*
  Warnings:

  - A unique constraint covering the columns `[refreshToken]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "dateExpired" SET DEFAULT NOW() + interval '30 day';

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_refreshToken_key" ON "RefreshToken"("refreshToken");
