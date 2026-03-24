import { Test, TestingModule } from '@nestjs/testing';
import { RepairRequestsController } from './repair-requests.controller';
import { RepairRequestsService } from './repair-requests.service';

describe('RepairRequestsController', () => {
  let controller: RepairRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepairRequestsController],
      providers: [RepairRequestsService],
    }).compile();

    controller = module.get<RepairRequestsController>(RepairRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
