export type RoleName = 'admin' | 'hr' | 'technician' | 'user';

export interface Role {
  id: number;
  name: RoleName;
}
