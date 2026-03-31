/*
  Warnings:

  - You are about to drop the column `item_id` on the `assignment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `parts_used` on the `repair_requests` table. All the data in the column will be lost.
  - You are about to drop the column `repair_summary` on the `repair_requests` table. All the data in the column will be lost.
  - The primary key for the `request_equipment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `request_equipment` table. All the data in the column will be lost.
  - Added the required column `seq_no` to the `request_equipment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "assignment_logs" DROP CONSTRAINT "assignment_logs_item_id_fkey";

-- DropIndex
DROP INDEX "assignment_logs_item_id_idx";

-- DropIndex
DROP INDEX "request_equipment_request_id_idx";

-- AlterTable
ALTER TABLE "assignment_logs" DROP COLUMN "item_id",
ADD COLUMN     "item_request_id" INTEGER,
ADD COLUMN     "item_seq_no" INTEGER;

-- AlterTable
ALTER TABLE "repair_requests" DROP COLUMN "parts_used",
DROP COLUMN "repair_summary";

-- AlterTable
ALTER TABLE "request_equipment" DROP CONSTRAINT "request_equipment_pkey",
DROP COLUMN "id",
ADD COLUMN     "parts_used" TEXT,
ADD COLUMN     "repair_summary" TEXT,
ADD COLUMN     "seq_no" INTEGER NOT NULL,
ADD CONSTRAINT "request_equipment_pkey" PRIMARY KEY ("request_id", "seq_no");

-- CreateIndex
CREATE INDEX "assignment_logs_item_request_id_item_seq_no_idx" ON "assignment_logs"("item_request_id", "item_seq_no");

-- AddForeignKey
ALTER TABLE "assignment_logs" ADD CONSTRAINT "assignment_logs_item_request_id_item_seq_no_fkey" FOREIGN KEY ("item_request_id", "item_seq_no") REFERENCES "request_equipment"("request_id", "seq_no") ON DELETE SET NULL ON UPDATE CASCADE;
