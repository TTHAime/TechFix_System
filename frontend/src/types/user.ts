import type { Role } from './role';
import type { Department } from './department';

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  deptId: number;
  provider: 'local' | 'google';
  isActive: boolean;
  createdAt: string;
  role: Role;
  department: Department;
}
