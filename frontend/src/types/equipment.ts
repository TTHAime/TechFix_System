import type { Department } from './department';

export interface EquipmentCategory {
  id: number;
  name: string;
}

export interface Equipment {
  id: number;
  name: string;
  serialNo: string;
  categoryId: number;
  deptId: number;
  isActive: boolean;
  category: EquipmentCategory;
  department: Department;
}
