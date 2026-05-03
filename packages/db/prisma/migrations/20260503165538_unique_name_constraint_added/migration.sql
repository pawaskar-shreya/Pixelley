/*
  Warnings:

  - You are about to drop the column `isUserPlaceable` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `isDeletable` on the `SpaceElement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Avatar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Element` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Space` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Element" DROP COLUMN "isUserPlaceable";

-- AlterTable
ALTER TABLE "SpaceElement" DROP COLUMN "isDeletable";

-- CreateIndex
CREATE UNIQUE INDEX "Avatar_name_key" ON "Avatar"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Element_name_key" ON "Element"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Space_name_key" ON "Space"("name");
