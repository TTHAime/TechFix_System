-- AlterTable
ALTER TABLE "assignment_logs" ADD COLUMN     "item_id" INTEGER;

-- AlterTable
ALTER TABLE "request_equipment" ADD COLUMN     "resolved_at" TIMESTAMPTZ,
ADD COLUMN     "status_id" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "technician_id" INTEGER;

-- CreateIndex
CREATE INDEX "assignment_logs_item_id_idx" ON "assignment_logs"("item_id");

-- CreateIndex
CREATE INDEX "request_equipment_status_id_idx" ON "request_equipment"("status_id");

-- CreateIndex
CREATE INDEX "request_equipment_technician_id_idx" ON "request_equipment"("technician_id");

-- AddForeignKey
ALTER TABLE "request_equipment" ADD CONSTRAINT "request_equipment_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "request_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_equipment" ADD CONSTRAINT "request_equipment_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_logs" ADD CONSTRAINT "assignment_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "request_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
