import { Test, TestingModule } from '@nestjs/testing';
import { RepairRequestsService } from './repair-requests.service';

describe('RepairRequestsService', () => {
  let service: RepairRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepairRequestsService],
    }).compile();

    service = module.get<RepairRequestsService>(RepairRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
