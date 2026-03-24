import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentCategoriesController } from './equipment-categories.controller';
import { EquipmentCategoriesService } from './equipment-categories.service';

describe('EquipmentCategoriesController', () => {
  let controller: EquipmentCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentCategoriesController],
      providers: [EquipmentCategoriesService],
    }).compile();

    controller = module.get<EquipmentCategoriesController>(EquipmentCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
