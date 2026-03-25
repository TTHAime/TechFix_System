/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `equipment_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_name_key" ON "equipment_categories"("name");
