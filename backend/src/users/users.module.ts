import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HashModule } from 'src/common/services/hash.module';

@Module({
  imports: [PrismaModule, HashModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
