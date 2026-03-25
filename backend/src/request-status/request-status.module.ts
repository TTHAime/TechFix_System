import { Module } from '@nestjs/common';
import { RequestStatusService } from './request-status.service';
import { RequestStatusController } from './request-status.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RequestStatusController],
  providers: [RequestStatusService],
})
export class RequestStatusModule {}
