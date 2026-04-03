import { Module } from '@nestjs/common';
import { RequestStatusService } from './request-status.service';
import { RequestStatusController } from './request-status.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditLogsModule } from 'src/audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [RequestStatusController],
  providers: [RequestStatusService],
})
export class RequestStatusModule {}
