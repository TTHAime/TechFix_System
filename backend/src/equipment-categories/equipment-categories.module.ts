import { Module } from '@nestjs/common';
import { EquipmentCategoriesService } from './equipment-categories.service';
import { EquipmentCategoriesController } from './equipment-categories.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditLogsModule } from 'src/audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [EquipmentCategoriesController],
  providers: [EquipmentCategoriesService],
})
export class EquipmentCategoriesModule {}
