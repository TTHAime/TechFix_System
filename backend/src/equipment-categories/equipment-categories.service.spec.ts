import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentCategoriesService } from './equipment-categories.service';

describe('EquipmentCategoriesService', () => {
  let service: EquipmentCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipmentCategoriesService],
    }).compile();

    service = module.get<EquipmentCategoriesService>(
      EquipmentCategoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
