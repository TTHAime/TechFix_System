import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class EquipmentCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEquipmentCategoryDto: CreateEquipmentCategoryDto) {
    try {
      return await this.prisma.equipmentCategory.create({
        data: { ...createEquipmentCategoryDto },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Equipment category name already exists');
      }
      throw e;
    }
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.equipmentCategory.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.equipmentCategory.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: number) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Equipment category #${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateEquipmentCategoryDto: UpdateEquipmentCategoryDto,
  ) {
    try {
      return await this.prisma.equipmentCategory.update({
        where: { id },
        data: updateEquipmentCategoryDto,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Equipment category #${id} not found`);
        if (e.code === 'P2002')
          throw new ConflictException('Equipment category name already exists');
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.equipmentCategory.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Equipment category #${id} not found`);
        if (e.code === 'P2003')
          throw new ConflictException(
            'Cannot delete category: it still has equipment assigned',
          );
      }
      throw e;
    }
  }
}
