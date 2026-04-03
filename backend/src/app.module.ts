import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { getLoggerConfig } from './common/logger/logger.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { DepartmentsModule } from './departments/departments.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EquipmentCategoriesModule } from './equipment-categories/equipment-categories.module';
import { EquipmentModule } from './equipment/equipment.module';
import { RepairRequestsModule } from './repair-requests/repair-requests.module';
import { RequestStatusModule } from './request-status/request-status.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    LoggerModule.forRoot(getLoggerConfig()),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    RolesModule,
    DepartmentsModule,
    UsersModule,
    AuthModule,
    EquipmentCategoriesModule,
    EquipmentModule,
    RepairRequestsModule,
    RequestStatusModule,
    AuditLogsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
