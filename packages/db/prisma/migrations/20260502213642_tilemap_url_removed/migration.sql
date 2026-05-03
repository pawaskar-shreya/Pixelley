/*
  Warnings:

  - You are about to drop the column `tilemapUrl` on the `Space` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpaceElement" DROP CONSTRAINT "SpaceElement_addedById_fkey";

-- AlterTable
ALTER TABLE "Element" ADD COLUMN     "isUserPlaceable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Space" DROP COLUMN "tilemapUrl";

-- AlterTable
ALTER TABLE "SpaceElement" ADD COLUMN     "isDeletable" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "addedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SpaceElement" ADD CONSTRAINT "SpaceElement_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
