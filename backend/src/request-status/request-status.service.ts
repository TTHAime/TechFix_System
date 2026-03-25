import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequestStatusDto } from './dto/create-request-status.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class RequestStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRequestStatusDto: CreateRequestStatusDto) {
    try {
      return await this.prisma.requestStatus.create({
        data: createRequestStatusDto,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Request status name already exists');
      }
      throw e;
    }
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.requestStatus.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.requestStatus.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: number) {
    const status = await this.prisma.requestStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`Request status #${id} not found`);
    }

    return status;
  }

  async update(id: number, updateRequestStatusDto: UpdateRequestStatusDto) {
    try {
      return await this.prisma.requestStatus.update({
        where: { id },
        data: updateRequestStatusDto,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Request status #${id} not found`);
        if (e.code === 'P2002')
          throw new ConflictException('Request status name already exists');
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.requestStatus.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Request status #${id} not found`);
        if (e.code === 'P2003')
          throw new ConflictException(
            'Cannot delete status: it is still used by repair requests',
          );
      }
      throw e;
    }
  }
}
