import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '../generated/prisma/internal/prismaNamespace.js';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      return await this.prisma.department.create({ data: createDepartmentDto });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Department name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.department.findMany();
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department #${id} not found`);
    }
    return department;
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    try {
      return await this.prisma.department.update({
        where: { id },
        data: updateDepartmentDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Department #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.department.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Department #${id} not found`);
      }
      throw error;
    }
  }
}
