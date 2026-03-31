import { Test, TestingModule } from '@nestjs/testing';
import { RepairRequestsController } from './repair-requests.controller';
import { RepairRequestsService } from './repair-requests.service';

describe('RepairRequestsController', () => {
  let controller: RepairRequestsController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    acceptItem: jest.fn(),
    assignItem: jest.fn(),
    unassignItem: jest.fn(),
    resolveItem: jest.fn(),
    update: jest.fn(),
    close: jest.fn(),
    confirm: jest.fn(),
    getStatusLogs: jest.fn(),
    getAssignmentLogs: jest.fn(),
    getAllAssignmentLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepairRequestsController],
      providers: [
        { provide: RepairRequestsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<RepairRequestsController>(RepairRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
