import { Module } from '@nestjs/common';
import { RepairRequestsService } from './repair-requests.service';
import { RepairRequestsController } from './repair-requests.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RepairRequestsController],
  providers: [RepairRequestsService],
})
export class RepairRequestsModule {}
