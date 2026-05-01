/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Avatar` table. All the data in the column will be lost.
  - You are about to drop the column `static` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Space` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Map` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MapElements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SpaceElements` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `downUrl` to the `Avatar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Avatar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idleUrl` to the `Avatar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leftUrl` to the `Avatar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rightUrl` to the `Avatar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upUrl` to the `Avatar` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `Avatar` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `Element` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `Element` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tilemapUrl` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Made the column `height` on table `Space` required. This step will fail if there are existing NULL values in that column.
  - Made the column `thumbnail` on table `Space` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `avatarId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "MapElements" DROP CONSTRAINT "MapElements_elementId_fkey";

-- DropForeignKey
ALTER TABLE "MapElements" DROP CONSTRAINT "MapElements_mapId_fkey";

-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceElements" DROP CONSTRAINT "SpaceElements_elementId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceElements" DROP CONSTRAINT "SpaceElements_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_avatarId_fkey";

-- DropIndex
DROP INDEX "Avatar_id_key";

-- DropIndex
DROP INDEX "Element_id_key";

-- DropIndex
DROP INDEX "Space_id_key";

-- DropIndex
DROP INDEX "User_id_key";

-- AlterTable
ALTER TABLE "Avatar" DROP COLUMN "imageUrl",
ADD COLUMN     "downUrl" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "idleUrl" TEXT NOT NULL,
ADD COLUMN     "leftUrl" TEXT NOT NULL,
ADD COLUMN     "rightUrl" TEXT NOT NULL,
ADD COLUMN     "upUrl" TEXT NOT NULL,
ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "Element" DROP COLUMN "static",
ADD COLUMN     "isCollidable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "spaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Space" DROP COLUMN "creatorId",
ADD COLUMN     "tilemapUrl" TEXT NOT NULL,
ALTER COLUMN "height" SET NOT NULL,
ALTER COLUMN "thumbnail" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "gender" TEXT NOT NULL,
ALTER COLUMN "avatarId" SET NOT NULL;

-- DropTable
DROP TABLE "Map";

-- DropTable
DROP TABLE "MapElements";

-- DropTable
DROP TABLE "SpaceElements";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "SpaceElement" (
    "id" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,

    CONSTRAINT "SpaceElement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceElement" ADD CONSTRAINT "SpaceElement_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceElement" ADD CONSTRAINT "SpaceElement_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceElement" ADD CONSTRAINT "SpaceElement_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
