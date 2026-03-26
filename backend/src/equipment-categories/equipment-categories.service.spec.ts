import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EquipmentCategoriesService } from './equipment-categories.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

const fakeCategory = { id: 1, name: 'Laptop' };
const fakeCategory2 = { id: 2, name: 'Monitor' };

const createDto = { name: 'Laptop' };
const updateDto = { name: 'Laptop Pro' };

const paginationQuery = { page: 1, limit: 20 };

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
}

describe('EquipmentCategoriesService', () => {
  let service: EquipmentCategoriesService;

  const mockPrisma = {
    equipmentCategory: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentCategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EquipmentCategoriesService>(
      EquipmentCategoriesService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('returns the created category', async () => {
      mockPrisma.equipmentCategory.create.mockResolvedValue(fakeCategory);

      const result = await service.create(createDto);

      expect(result).toEqual(fakeCategory);
    });

    it('throws ConflictException on duplicate name (P2002)', async () => {
      mockPrisma.equipmentCategory.create.mockRejectedValue(
        makePrismaError('P2002'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('re-throws unexpected errors without wrapping', async () => {
      mockPrisma.equipmentCategory.create.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('findOne', () => {
    it('returns the category when found', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(fakeCategory);
    });

    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns data and pagination meta', async () => {
      mockPrisma.equipmentCategory.findMany.mockResolvedValue([
        fakeCategory,
        fakeCategory2,
      ]);
      mockPrisma.equipmentCategory.count.mockResolvedValue(2);

      const result = await service.findAll(paginationQuery);

      expect(result.data).toEqual([fakeCategory, fakeCategory2]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 2 });
    });

    it('uses default page=1 and limit=20 when not provided', async () => {
      mockPrisma.equipmentCategory.findMany.mockResolvedValue([fakeCategory]);
      mockPrisma.equipmentCategory.count.mockResolvedValue(1);

      await service.findAll({});

      expect(mockPrisma.equipmentCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('calculates correct skip based on page', async () => {
      mockPrisma.equipmentCategory.findMany.mockResolvedValue([]);
      mockPrisma.equipmentCategory.count.mockResolvedValue(30);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.equipmentCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('update', () => {
    it('returns the updated category', async () => {
      const updatedCategory = { ...fakeCategory, name: updateDto.name };
      mockPrisma.equipmentCategory.update.mockResolvedValue(updatedCategory);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedCategory);
    });

    it('throws NotFoundException when category does not exist (P2025)', async () => {
      mockPrisma.equipmentCategory.update.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException on duplicate name (P2002)', async () => {
      mockPrisma.equipmentCategory.update.mockRejectedValue(
        makePrismaError('P2002'),
      );

      await expect(service.update(1, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('re-throws unexpected errors without wrapping', async () => {
      mockPrisma.equipmentCategory.update.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.update(1, updateDto)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('delete', () => {
    it('returns the deleted category', async () => {
      mockPrisma.equipmentCategory.delete.mockResolvedValue(fakeCategory);

      const result = await service.remove(1);

      expect(result).toEqual(fakeCategory);
    });

    it('throws NotFoundException when category does not exist (P2025)', async () => {
      mockPrisma.equipmentCategory.delete.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when category still has equipment assigned (P2003)', async () => {
      mockPrisma.equipmentCategory.delete.mockRejectedValue(
        makePrismaError('P2003'),
      );

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });

    it('re-throws unexpected errors without wrapping', async () => {
      mockPrisma.equipmentCategory.delete.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.remove(1)).rejects.toThrow('DB connection lost');
    });
  });
});
