/*
  Warnings:

  - The `sexId` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[countryName]` on the table `Country` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[countryCode]` on the table `Country` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hobby]` on the table `Hobby` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[language]` on the table `Language` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('NK', 'M', 'F', 'NA');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "sexId",
ADD COLUMN     "sexId" "Sex" NOT NULL DEFAULT 'NK';

-- CreateIndex
CREATE UNIQUE INDEX "Country_countryName_key" ON "Country"("countryName");

-- CreateIndex
CREATE UNIQUE INDEX "Country_countryCode_key" ON "Country"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Hobby_hobby_key" ON "Hobby"("hobby");

-- CreateIndex
CREATE UNIQUE INDEX "Language_language_key" ON "Language"("language");
