import { Module } from '@nestjs/common';
import { EquipmentCategoriesService } from './equipment-categories.service';
import { EquipmentCategoriesController } from './equipment-categories.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentCategoriesController],
  providers: [EquipmentCategoriesService],
})
export class EquipmentCategoriesModule {}
