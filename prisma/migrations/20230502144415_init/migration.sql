-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "Country" (
    "countryId" SERIAL NOT NULL,
    "countryName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("countryId")
);

-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "secondName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profilePhotoURL" TEXT,
    "sexId" INTEGER NOT NULL DEFAULT 1,
    "birthdayDate" TIMESTAMP(3) NOT NULL,
    "countryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserDetails" (
    "userId" INTEGER NOT NULL,
    "bio" TEXT NOT NULL,
    "lookingForText" TEXT
);

-- CreateTable
CREATE TABLE "Hobby" (
    "hobbyId" SERIAL NOT NULL,
    "hobby" TEXT NOT NULL,

    CONSTRAINT "Hobby_pkey" PRIMARY KEY ("hobbyId")
);

-- CreateTable
CREATE TABLE "Language" (
    "languageId" SERIAL NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("languageId")
);

-- CreateTable
CREATE TABLE "_HobbyToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_LanguageToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserDetails_userId_key" ON "UserDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_HobbyToUser_AB_unique" ON "_HobbyToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_HobbyToUser_B_index" ON "_HobbyToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LanguageToUser_AB_unique" ON "_LanguageToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_LanguageToUser_B_index" ON "_LanguageToUser"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("countryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HobbyToUser" ADD CONSTRAINT "_HobbyToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Hobby"("hobbyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HobbyToUser" ADD CONSTRAINT "_HobbyToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToUser" ADD CONSTRAINT "_LanguageToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Language"("languageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToUser" ADD CONSTRAINT "_LanguageToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
