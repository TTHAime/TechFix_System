import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createEquipmentDto: CreateEquipmentDto) {
    try {
      return await this.prisma.equipment.create({
        data: { ...createEquipmentDto },
        include: { department: true, category: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException(`Equipment already exist`);
        }

        if (e.code === 'P2003') {
          throw new BadRequestException('Invalid categoryId or deptId');
        }
      }
    }
  }

  async findAll() {
    return this.prisma.equipment.findMany({
      orderBy: { id: 'asc' },
      include: { department: true, category: true },
    });
  }

  async findOne(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: { department: true, category: true },
    });

    if (!equipment) throw new NotFoundException(`Not found Equipment ${id}`);

    return equipment;
  }

  async update(id: number, updateEquipmentDto: UpdateEquipmentDto) {
    try {
      return await this.prisma.equipment.update({
        where: { id },
        data: { ...updateEquipmentDto },
        include: { department: true, category: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Equipment #${id} not found`);
        if (e.code === 'P2002')
          throw new ConflictException('Equipment name already exists');
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.equipment.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Equipment #${id} not found`);
        if (e.code === 'P2003')
          throw new ConflictException(
            'Cannot delete equipment: it is referenced by a repair request',
          );
      }
      throw e;
    }
  }
}
