import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '../generated/prisma/internal/prismaNamespace.js';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({ data: createRoleDto });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Role name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.role.findMany();
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      return await this.prisma.role.update({
        where: { id },
        data: updateRoleDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Role #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.role.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Role #${id} not found`);
      }
      throw error;
    }
  }
}
